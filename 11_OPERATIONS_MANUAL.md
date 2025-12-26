# AutoClip Operations Manual

## 문서 정보
- **버전**: 1.0.0
- **최종 수정일**: 2024-12-24
- **작성자**: AutoClip DevOps Team
- **대상 독자**: 운영 엔지니어, SRE, DevOps

---

## 1. 운영 개요

### 1.1 시스템 구성

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Production Environment                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Internet → CloudFlare → ALB → EKS Cluster                             │
│                                    │                                    │
│              ┌─────────────────────┼─────────────────────┐             │
│              │                     │                     │             │
│              ▼                     ▼                     ▼             │
│         ┌─────────┐          ┌─────────┐          ┌─────────┐         │
│         │   API   │          │   n8n   │          │  Worker │         │
│         │ (x3-10) │          │  (x3)   │          │  (x2-5) │         │
│         └────┬────┘          └────┬────┘          └────┬────┘         │
│              │                    │                    │               │
│              └────────────────────┼────────────────────┘               │
│                                   │                                    │
│              ┌────────────────────┼────────────────────┐               │
│              │                    │                    │               │
│              ▼                    ▼                    ▼               │
│         ┌─────────┐          ┌─────────┐          ┌─────────┐         │
│         │ RDS     │          │ Elasti  │          │   S3    │         │
│         │Postgres │          │  Cache  │          │ Storage │         │
│         └─────────┘          └─────────┘          └─────────┘         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 SLA 목표

| 지표 | 목표값 | 측정 방법 |
|------|--------|----------|
| **가용성** | 99.5% | Uptime 모니터링 |
| **API 응답시간 (p95)** | <500ms | Prometheus |
| **콘텐츠 생성 성공률** | >95% | 로그 분석 |
| **에러율** | <0.5% | Application metrics |
| **RTO** | 4시간 | 장애 복구 시간 |
| **RPO** | 1시간 | 데이터 손실 허용 |

### 1.3 연락처

| 역할 | 담당 | 연락처 |
|------|------|--------|
| **Primary On-Call** | Rotation | PagerDuty |
| **Secondary On-Call** | Rotation | PagerDuty |
| **Engineering Lead** | TBD | Slack #eng-leads |
| **Database Admin** | TBD | Slack #dba |
| **Security** | TBD | security@autoclip.io |
| **AWS Support** | - | AWS Console |

---

## 2. 인프라 관리

### 2.1 Kubernetes 클러스터

#### 클러스터 정보
```bash
# 클러스터 접속
aws eks update-kubeconfig --name autoclip-prod --region ap-northeast-2

# 클러스터 상태 확인
kubectl cluster-info
kubectl get nodes -o wide

# 네임스페이스
kubectl get namespaces
# - autoclip: 메인 애플리케이션
# - monitoring: Prometheus, Grafana
# - ingress-nginx: Ingress Controller
# - cert-manager: SSL 인증서
```

#### Pod 관리
```bash
# Pod 상태 확인
kubectl get pods -n autoclip -o wide

# Pod 로그 확인
kubectl logs -f deployment/autoclip-api -n autoclip --tail=100

# Pod 재시작
kubectl rollout restart deployment/autoclip-api -n autoclip

# Pod 스케일링
kubectl scale deployment autoclip-api --replicas=5 -n autoclip

# HPA 상태 확인
kubectl get hpa -n autoclip
```

#### 리소스 사용량
```bash
# 노드 리소스
kubectl top nodes

# Pod 리소스
kubectl top pods -n autoclip

# 리소스 상세
kubectl describe node <node-name>
```

### 2.2 데이터베이스 (RDS)

#### 연결 정보
```bash
# 프로덕션 DB
Host: autoclip-prod.xxxxx.ap-northeast-2.rds.amazonaws.com
Port: 5432
Database: autoclip
User: autoclip_app (read/write), autoclip_readonly (read only)

# Read Replica
Host: autoclip-prod-replica.xxxxx.ap-northeast-2.rds.amazonaws.com
```

#### 접속 방법
```bash
# Bastion을 통한 접속
ssh -L 5432:autoclip-prod.xxxxx.rds.amazonaws.com:5432 bastion

# psql 연결
PGPASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id autoclip/prod/db \
  --query SecretString --output text | jq -r '.password') \
psql -h localhost -U autoclip_app -d autoclip
```

#### 일반 쿼리
```sql
-- 활성 연결 수
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- 느린 쿼리 확인
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds'
AND state = 'active';

-- 테이블 크기
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 10;

-- 인덱스 사용률
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC
LIMIT 20;
```

### 2.3 Redis (ElastiCache)

#### 연결 정보
```bash
# Primary
Host: autoclip-redis.xxxxx.ng.0001.apn2.cache.amazonaws.com
Port: 6379

# Cluster Mode
redis-cli -h autoclip-redis.xxxxx.ng.0001.apn2.cache.amazonaws.com -p 6379
```

#### 일반 명령
```bash
# 메모리 사용량
redis-cli INFO memory

# 키 통계
redis-cli INFO keyspace

# 느린 로그
redis-cli SLOWLOG GET 10

# 특정 패턴 키 조회
redis-cli KEYS "session:*" | head -20

# 캐시 무효화
redis-cli DEL "cache:contents:list"
redis-cli KEYS "cache:*" | xargs redis-cli DEL
```

### 2.4 S3 스토리지

#### 버킷 구조
```
autoclip-content-prod/
├── videos/
│   └── {content_id}/
│       ├── original.mp4
│       ├── thumbnail.jpg
│       └── audio.mp3
├── images/
│   └── {content_id}/
│       └── scene_{n}.png
├── exports/
│   └── {user_id}/
└── temp/
```

#### 관리 명령
```bash
# 버킷 사용량
aws s3 ls s3://autoclip-content-prod --summarize --recursive | tail -2

# 오래된 temp 파일 정리
aws s3 rm s3://autoclip-content-prod/temp/ --recursive \
  --exclude "*" --include "*" \
  --dryrun  # 실제 삭제 시 제거

# 특정 콘텐츠 파일 확인
aws s3 ls s3://autoclip-content-prod/videos/{content_id}/
```

---

## 3. 배포 관리

### 3.1 배포 프로세스

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Merge   │───▶│  Build   │───▶│ Staging  │───▶│  Prod    │
│  to main │    │  & Test  │    │  Deploy  │    │  Deploy  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                     │              │
                                     ▼              ▼
                                ┌──────────┐   ┌──────────┐
                                │ Smoke    │   │ Canary   │
                                │ Tests    │   │ 5분 모니터│
                                └──────────┘   └──────────┘
```

### 3.2 배포 명령

#### ArgoCD 배포
```bash
# 애플리케이션 상태 확인
argocd app get autoclip-api

# 수동 동기화
argocd app sync autoclip-api

# 이전 버전으로 롤백
argocd app rollback autoclip-api <revision>

# 배포 히스토리
argocd app history autoclip-api
```

#### kubectl 배포
```bash
# 현재 이미지 확인
kubectl get deployment autoclip-api -n autoclip -o jsonpath='{.spec.template.spec.containers[0].image}'

# 이미지 업데이트 (긴급 시)
kubectl set image deployment/autoclip-api \
  autoclip-api=123456789.dkr.ecr.ap-northeast-2.amazonaws.com/autoclip-api:v1.2.3 \
  -n autoclip

# 롤백
kubectl rollout undo deployment/autoclip-api -n autoclip

# 특정 버전으로 롤백
kubectl rollout undo deployment/autoclip-api -n autoclip --to-revision=3

# 배포 상태 확인
kubectl rollout status deployment/autoclip-api -n autoclip
```

### 3.3 Blue-Green 배포

```bash
# Blue (현재 프로덕션) 확인
kubectl get service autoclip-api -n autoclip -o jsonpath='{.spec.selector}'

# Green 배포 생성
kubectl apply -f k8s/green-deployment.yaml

# Green 상태 확인
kubectl get pods -l version=green -n autoclip

# 트래픽 전환 (Service selector 변경)
kubectl patch service autoclip-api -n autoclip -p '{"spec":{"selector":{"version":"green"}}}'

# 문제 시 롤백
kubectl patch service autoclip-api -n autoclip -p '{"spec":{"selector":{"version":"blue"}}}'

# 이전 버전 정리
kubectl delete deployment autoclip-api-blue -n autoclip
```

---

## 4. 모니터링

### 4.1 대시보드

| 대시보드 | URL | 용도 |
|----------|-----|------|
| **Grafana Main** | https://grafana.autoclip.io | 메인 대시보드 |
| **API Metrics** | grafana.../d/api-metrics | API 성능 |
| **n8n Workflows** | grafana.../d/n8n-metrics | 워크플로우 모니터링 |
| **Database** | grafana.../d/rds-metrics | RDS 메트릭 |
| **Kubernetes** | grafana.../d/k8s-cluster | 클러스터 상태 |

### 4.2 주요 메트릭

#### API 메트릭
```promql
# 요청 처리량 (RPM)
sum(rate(http_requests_total{service="autoclip-api"}[1m])) * 60

# 응답시간 p95
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{service="autoclip-api"}[5m]))

# 에러율
sum(rate(http_requests_total{service="autoclip-api",status=~"5.."}[5m])) 
/ sum(rate(http_requests_total{service="autoclip-api"}[5m])) * 100

# 활성 연결 수
sum(nginx_connections_active)
```

#### 콘텐츠 생성 메트릭
```promql
# 생성 성공률
sum(rate(content_generation_total{status="success"}[1h])) 
/ sum(rate(content_generation_total[1h])) * 100

# 평균 생성 시간
avg(content_generation_duration_seconds)

# 대기 중인 Job 수
sum(bull_waiting_count{queue="content-generation"})
```

### 4.3 로그 확인

#### CloudWatch Logs
```bash
# API 로그 조회
aws logs filter-log-events \
  --log-group-name /eks/autoclip/api \
  --filter-pattern "ERROR" \
  --start-time $(date -d '1 hour ago' +%s)000

# 특정 요청 추적
aws logs filter-log-events \
  --log-group-name /eks/autoclip/api \
  --filter-pattern '{ $.requestId = "abc-123" }'
```

#### kubectl logs
```bash
# 실시간 로그
kubectl logs -f deployment/autoclip-api -n autoclip --all-containers

# 에러만 필터링
kubectl logs deployment/autoclip-api -n autoclip | grep -i error

# 이전 Pod 로그
kubectl logs deployment/autoclip-api -n autoclip --previous
```

### 4.4 알림 규칙

| 알림 | 조건 | 심각도 | 대응 |
|------|------|--------|------|
| **HighErrorRate** | 에러율 >5% (5분) | Critical | 즉시 조사 |
| **HighLatency** | p95 >2s (5분) | Warning | 30분 내 확인 |
| **PodCrashLoop** | 재시작 >5회 (10분) | Critical | 즉시 조사 |
| **HighMemory** | 메모리 >90% | Warning | 스케일링 검토 |
| **DatabaseConnections** | 연결 >80% | Warning | 풀 크기 확인 |
| **QueueBacklog** | 대기 Job >100 | Warning | Worker 스케일링 |

---

## 5. 장애 대응

### 5.1 장애 등급

| 등급 | 설명 | 예시 | 대응 시간 |
|------|------|------|----------|
| **P1 (Critical)** | 서비스 전체 장애 | API 전면 중단, DB 장애 | 15분 이내 |
| **P2 (High)** | 주요 기능 장애 | 콘텐츠 생성 실패, 결제 실패 | 1시간 이내 |
| **P3 (Medium)** | 부분 기능 저하 | 느린 응답, 일부 API 오류 | 4시간 이내 |
| **P4 (Low)** | 경미한 이슈 | UI 버그, 문서 오류 | 24시간 이내 |

### 5.2 장애 대응 플로우

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Incident Response Flow                         │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. 탐지     2. 분류     3. 대응      4. 복구     5. 사후분석      │
│  ┌─────┐   ┌─────┐    ┌─────┐     ┌─────┐     ┌─────┐            │
│  │Alert│──▶│Triage│──▶│Mitigate│──▶│Resolve│──▶│Postmortem│       │
│  └─────┘   └─────┘    └─────┘     └─────┘     └─────┘            │
│     │         │          │           │           │                │
│     ▼         ▼          ▼           ▼           ▼                │
│  PagerDuty  등급결정   긴급조치    근본해결    RCA문서           │
│             팀소집     통신시작    모니터링    개선계획           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 5.3 일반 장애 시나리오

#### 시나리오 1: API 응답 지연

```bash
# 1. 현재 상태 확인
kubectl top pods -n autoclip
kubectl get hpa -n autoclip

# 2. 최근 배포 확인
kubectl rollout history deployment/autoclip-api -n autoclip

# 3. DB 연결 확인
kubectl exec -it deployment/autoclip-api -n autoclip -- \
  nc -zv autoclip-prod.xxxxx.rds.amazonaws.com 5432

# 4. 느린 쿼리 확인
# (DB 접속 후)
SELECT pid, now() - query_start AS duration, query 
FROM pg_stat_activity 
WHERE state = 'active' AND query_start < now() - interval '10 seconds';

# 5. 스케일 아웃
kubectl scale deployment autoclip-api --replicas=10 -n autoclip

# 6. 이전 버전 롤백 (필요시)
kubectl rollout undo deployment/autoclip-api -n autoclip
```

#### 시나리오 2: 콘텐츠 생성 실패 급증

```bash
# 1. n8n 상태 확인
kubectl get pods -l app=n8n -n autoclip
kubectl logs -l app=n8n -n autoclip --tail=100

# 2. Redis Queue 확인
redis-cli LLEN bull:content-generation:waiting
redis-cli LLEN bull:content-generation:failed

# 3. 실패한 Job 확인
redis-cli LRANGE bull:content-generation:failed 0 10

# 4. 외부 API 상태 확인
curl -I https://generativelanguage.googleapis.com/v1beta/models
curl -I https://api.elevenlabs.io/v1/user

# 5. n8n Worker 재시작
kubectl rollout restart deployment/n8n-worker -n autoclip

# 6. 실패한 Job 재시도
# (n8n UI 또는 API로)
```

#### 시나리오 3: 데이터베이스 연결 포화

```bash
# 1. 현재 연결 수 확인
SELECT count(*) FROM pg_stat_activity;
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;

# 2. 오래된 연결 확인
SELECT pid, usename, client_addr, state, query_start 
FROM pg_stat_activity 
WHERE state = 'idle' AND query_start < now() - interval '10 minutes';

# 3. 유휴 연결 종료
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' AND query_start < now() - interval '30 minutes';

# 4. API Pod 순차 재시작 (연결 풀 초기화)
kubectl rollout restart deployment/autoclip-api -n autoclip

# 5. PgBouncer 확인 (사용 중인 경우)
kubectl logs deployment/pgbouncer -n autoclip
```

### 5.4 긴급 조치

#### API 트래픽 차단
```bash
# 특정 엔드포인트 차단 (Ingress)
kubectl patch ingress autoclip-api -n autoclip --type=json \
  -p='[{"op": "add", "path": "/metadata/annotations/nginx.ingress.kubernetes.io~1server-snippet", "value": "location /api/v1/contents { return 503; }"}]'

# 복구
kubectl patch ingress autoclip-api -n autoclip --type=json \
  -p='[{"op": "remove", "path": "/metadata/annotations/nginx.ingress.kubernetes.io~1server-snippet"}]'
```

#### 읽기 전용 모드
```bash
# 환경 변수 업데이트
kubectl set env deployment/autoclip-api MAINTENANCE_MODE=true -n autoclip

# 복구
kubectl set env deployment/autoclip-api MAINTENANCE_MODE=false -n autoclip
```

---

## 6. 백업 및 복구

### 6.1 백업 현황

| 대상 | 주기 | 보존 기간 | 위치 |
|------|------|----------|------|
| **RDS Snapshot** | 매일 | 30일 | AWS RDS |
| **RDS PITR** | 연속 | 7일 | AWS RDS |
| **Redis Backup** | 4시간 | 7일 | S3 |
| **S3 Content** | - | Versioning | S3 |
| **MongoDB** | 매일 | 14일 | Atlas |

### 6.2 복구 절차

#### RDS Point-in-Time Recovery
```bash
# 복구 가능 시간 확인
aws rds describe-db-instances --db-instance-identifier autoclip-prod \
  --query 'DBInstances[0].LatestRestorableTime'

# 특정 시점으로 복구 (새 인스턴스 생성)
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier autoclip-prod \
  --target-db-instance-identifier autoclip-prod-recovered \
  --restore-time 2024-01-15T10:00:00Z

# 복구된 인스턴스 확인
aws rds describe-db-instances --db-instance-identifier autoclip-prod-recovered

# 애플리케이션 연결 전환
kubectl set env deployment/autoclip-api \
  DATABASE_URL=postgresql://...@autoclip-prod-recovered...
```

#### S3 버전 복구
```bash
# 삭제된 객체 복구
aws s3api list-object-versions \
  --bucket autoclip-content-prod \
  --prefix videos/content-123/ \
  --query 'DeleteMarkers[?IsLatest==`true`]'

# 특정 버전 복원
aws s3api delete-object \
  --bucket autoclip-content-prod \
  --key videos/content-123/original.mp4 \
  --version-id "delete-marker-version-id"
```

---

## 7. 정기 작업

### 7.1 일일 작업

| 시간 | 작업 | 담당 |
|------|------|------|
| 09:00 | 야간 알림 검토 | On-Call |
| 09:30 | 주요 지표 확인 | On-Call |
| 17:00 | 일일 배포 현황 정리 | DevOps |

#### 일일 체크리스트
```bash
# 1. 클러스터 상태
kubectl get nodes
kubectl get pods -n autoclip | grep -v Running

# 2. 에러 로그 확인
aws logs filter-log-events \
  --log-group-name /eks/autoclip/api \
  --filter-pattern "ERROR" \
  --start-time $(date -d '24 hours ago' +%s)000 \
  | jq '.events | length'

# 3. 디스크 사용량
kubectl exec -it deployment/autoclip-api -n autoclip -- df -h

# 4. 인증서 만료 확인
kubectl get certificates -A
```

### 7.2 주간 작업

| 요일 | 작업 |
|------|------|
| 월 | 주간 용량 리뷰 |
| 수 | 보안 패치 검토 |
| 금 | 주간 SLA 리포트 |

#### 주간 체크리스트
```bash
# 1. 미사용 리소스 정리
kubectl get pods -n autoclip --field-selector=status.phase=Failed
kubectl delete pods -n autoclip --field-selector=status.phase=Failed

# 2. Docker 이미지 정리
aws ecr describe-images --repository-name autoclip-api \
  --filter tagStatus=UNTAGGED \
  --query 'imageDetails[*].imageDigest' \
  | xargs -I {} aws ecr batch-delete-image --repository-name autoclip-api --image-ids imageDigest={}

# 3. S3 temp 정리
aws s3 rm s3://autoclip-content-prod/temp/ --recursive \
  --exclude "*" --include "*" \
  --only-show-errors
```

### 7.3 월간 작업

| 주차 | 작업 |
|------|------|
| 1주 | 비용 분석 리포트 |
| 2주 | 인프라 최적화 검토 |
| 3주 | 재해 복구 테스트 |
| 4주 | 보안 감사 |

---

## 8. 비용 관리

### 8.1 월별 예상 비용

| 서비스 | 사양 | 월 비용 |
|--------|------|---------|
| **EKS Cluster** | Control Plane | $73 |
| **EC2 (Worker)** | 3x m5.large | ~$230 |
| **RDS PostgreSQL** | db.r5.large Multi-AZ | ~$340 |
| **ElastiCache** | cache.r5.large x2 | ~$230 |
| **S3** | ~500GB | ~$15 |
| **CloudFront** | ~2TB | ~$200 |
| **기타** | VPC, Route53, etc | ~$50 |
| **합계** | | **~$1,138/월** |

### 8.2 비용 최적화

```bash
# Reserved Instance 추천
aws ce get-reservation-coverage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY

# 미사용 EBS 볼륨
aws ec2 describe-volumes \
  --filters Name=status,Values=available \
  --query 'Volumes[*].[VolumeId,Size,CreateTime]'

# 오래된 스냅샷
aws ec2 describe-snapshots --owner-ids self \
  --query 'Snapshots[?StartTime<=`2023-01-01`].[SnapshotId,VolumeSize,StartTime]'
```

---

## 9. 문서 및 런북

### 9.1 런북 목록

| 런북 | 설명 | 위치 |
|------|------|------|
| API 장애 대응 | API 서버 장애 시 | /runbooks/api-outage.md |
| DB 복구 | 데이터베이스 복구 | /runbooks/db-recovery.md |
| 보안 인시던트 | 보안 사고 대응 | /runbooks/security-incident.md |
| 스케일링 | 수동 스케일링 절차 | /runbooks/scaling.md |

### 9.2 변경 관리

모든 프로덕션 변경은 다음을 따릅니다:

1. **변경 요청** → Jira 티켓 생성
2. **검토** → 기술 리드 승인
3. **테스트** → 스테이징 환경 검증
4. **배포** → 정해진 배포 윈도우
5. **검증** → 배포 후 모니터링
6. **문서화** → 변경 이력 기록

---

## 10. 보안 운영

### 10.1 접근 제어

```bash
# IAM 역할 확인
aws iam list-roles --query 'Roles[?contains(RoleName, `autoclip`)].[RoleName,Arn]'

# K8s RBAC 확인
kubectl get clusterrolebindings -o wide | grep autoclip
kubectl get rolebindings -n autoclip -o wide
```

### 10.2 시크릿 교체

```bash
# 시크릿 목록
aws secretsmanager list-secrets --filters Key=name,Values=autoclip

# 시크릿 교체
aws secretsmanager rotate-secret --secret-id autoclip/prod/api-key

# K8s 시크릿 동기화
kubectl delete secret autoclip-secrets -n autoclip
kubectl create secret generic autoclip-secrets \
  --from-literal=DB_PASSWORD=$(aws secretsmanager get-secret-value --secret-id autoclip/prod/db --query SecretString --output text | jq -r '.password') \
  -n autoclip
```

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2024-12-24 | 초기 버전 |
