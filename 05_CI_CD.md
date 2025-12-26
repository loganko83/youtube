# CI/CD 파이프라인 상세 스펙
## AI 기반 자동 동영상 콘텐츠 생성 플랫폼 "AutoClip"

---

## 1. CI/CD 개요

### 1.1 설계 원칙
```
1. GitOps: Git을 Single Source of Truth로 사용
2. 자동화: 모든 빌드, 테스트, 배포 자동화
3. 안전성: 롤백 가능, 블루-그린 배포
4. 관찰성: 모든 단계 모니터링 및 알림
5. 속도: 코드 커밋부터 프로덕션까지 15분 이내
```

### 1.2 전체 파이프라인 흐름

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              CI/CD PIPELINE OVERVIEW                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐   │
│  │  Code   │───▶│  Build  │───▶│  Test   │───▶│ Deploy  │───▶│ Monitor │   │
│  │  Push   │    │         │    │         │    │         │    │         │   │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘   │
│       │              │              │              │              │          │
│       ▼              ▼              ▼              ▼              ▼          │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         DETAILED STAGES                                  ││
│  │                                                                          ││
│  │  Git Push ──▶ Lint ──▶ Unit Test ──▶ Build ──▶ Integration Test        ││
│  │                                        │                                 ││
│  │                                        ▼                                 ││
│  │  Production ◀── Staging ◀── E2E Test ◀── Docker Push                   ││
│  │       │            │                                                     ││
│  │       ▼            ▼                                                     ││
│  │  [Monitoring]  [Approval]                                               ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 브랜치 전략

### 2.1 Git Flow 변형 (Trunk-Based with Features)
```
main (production)
  │
  ├── develop (staging)
  │     │
  │     ├── feature/user-auth
  │     ├── feature/content-generation
  │     ├── feature/analytics-dashboard
  │     │
  │     ├── bugfix/login-error
  │     └── hotfix/critical-fix
  │
  └── release/v1.0.0
```

### 2.2 브랜치 규칙
```yaml
Branch Rules:

main:
  protection: true
  required_reviews: 2
  required_status_checks:
    - lint
    - unit-test
    - integration-test
    - e2e-test
    - security-scan
  auto_delete_head: true
  
develop:
  protection: true
  required_reviews: 1
  required_status_checks:
    - lint
    - unit-test
    - integration-test
    
feature/*:
  protection: false
  auto_merge: squash
  
hotfix/*:
  protection: true
  required_reviews: 1
  fast_track: true
```

### 2.3 커밋 메시지 컨벤션
```
<type>(<scope>): <subject>

Types:
  feat:     새로운 기능
  fix:      버그 수정
  docs:     문서 수정
  style:    코드 포맷팅
  refactor: 리팩토링
  test:     테스트 추가/수정
  chore:    빌드, 설정 변경

Examples:
  feat(content): 콘텐츠 자동 생성 API 추가
  fix(auth): JWT 토큰 만료 처리 버그 수정
  docs(api): API 문서 엔드포인트 추가
```

---

## 3. GitHub Actions 워크플로우

### 3.1 메인 CI 워크플로우

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20.x'
  PYTHON_VERSION: '3.11'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # ============================================
  # Stage 1: Code Quality
  # ============================================
  lint:
    name: Lint & Format Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run ESLint
        run: npm run lint
        
      - name: Run Prettier check
        run: npm run format:check
        
      - name: Run TypeScript check
        run: npm run type-check

  # ============================================
  # Stage 2: Security Scan
  # ============================================
  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          severity: 'CRITICAL,HIGH'
          
      - name: Run npm audit
        run: npm audit --audit-level=high
        continue-on-error: true
        
      - name: Run SAST with Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/secrets
            p/typescript

  # ============================================
  # Stage 3: Unit Tests
  # ============================================
  unit-test:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: [lint]
    strategy:
      matrix:
        service: [web, api-user, api-project, api-content]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        working-directory: ./services/${{ matrix.service }}
        
      - name: Run unit tests
        run: npm run test:unit -- --coverage
        working-directory: ./services/${{ matrix.service }}
        
      - name: Upload coverage report
        uses: codecov/codecov-action@v3
        with:
          file: ./services/${{ matrix.service }}/coverage/lcov.info
          flags: ${{ matrix.service }}

  # ============================================
  # Stage 4: Build Docker Images
  # ============================================
  build:
    name: Build Docker Images
    runs-on: ubuntu-latest
    needs: [unit-test, security-scan]
    strategy:
      matrix:
        service: [web, api-user, api-project, api-content, api-analytics]
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
        
      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
          
      - name: Extract Docker metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/${{ matrix.service }}
          tags: |
            type=sha,prefix={{branch}}-
            type=ref,event=branch
            type=semver,pattern={{version}}
            
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./services/${{ matrix.service }}
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            BUILD_DATE=${{ github.event.head_commit.timestamp }}
            VERSION=${{ github.sha }}

  # ============================================
  # Stage 5: Integration Tests
  # ============================================
  integration-test:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: [build]
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: autoclip_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        ports:
          - 6379:6379
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run database migrations
        run: npm run db:migrate
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/autoclip_test
          
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/autoclip_test
          REDIS_URL: redis://localhost:6379

  # ============================================
  # Stage 6: E2E Tests
  # ============================================
  e2e-test:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: [integration-test]
    if: github.ref == 'refs/heads/develop' || github.ref == 'refs/heads/main'
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          
      - name: Install Playwright
        run: npx playwright install --with-deps
        
      - name: Start test environment
        run: docker-compose -f docker-compose.test.yml up -d
        
      - name: Wait for services
        run: |
          npm run wait-for-services
          
      - name: Run E2E tests
        run: npm run test:e2e
        
      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

  # ============================================
  # Stage 7: Deploy to Staging
  # ============================================
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [e2e-test]
    if: github.ref == 'refs/heads/develop'
    environment:
      name: staging
      url: https://staging.autoclip.io
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-2
          
      - name: Setup kubectl
        uses: azure/setup-kubectl@v3
        
      - name: Update kubeconfig
        run: aws eks update-kubeconfig --name autoclip-staging --region ap-northeast-2
        
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/api-user \
            api-user=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/api-user:develop-${{ github.sha }} \
            -n autoclip-staging
          kubectl set image deployment/api-content \
            api-content=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/api-content:develop-${{ github.sha }} \
            -n autoclip-staging
          kubectl rollout status deployment/api-user -n autoclip-staging --timeout=300s
          kubectl rollout status deployment/api-content -n autoclip-staging --timeout=300s
          
      - name: Run smoke tests
        run: |
          npm run test:smoke -- --base-url https://staging.autoclip.io
          
      - name: Notify Slack
        uses: slackapi/slack-github-action@v1.24.0
        with:
          payload: |
            {
              "text": "✅ Staging deployment successful!",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Staging Deployment*\n• Commit: `${{ github.sha }}`\n• Author: ${{ github.actor }}\n• URL: https://staging.autoclip.io"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

  # ============================================
  # Stage 8: Deploy to Production
  # ============================================
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [e2e-test]
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://app.autoclip.io
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-2
          
      - name: Setup kubectl
        uses: azure/setup-kubectl@v3
        
      - name: Update kubeconfig
        run: aws eks update-kubeconfig --name autoclip-prod --region ap-northeast-2
        
      # Blue-Green Deployment
      - name: Deploy to Green environment
        run: |
          # Update green deployment
          kubectl apply -f k8s/production/green/ -n autoclip-prod
          kubectl set image deployment/api-user-green \
            api-user=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/api-user:main-${{ github.sha }} \
            -n autoclip-prod
          kubectl rollout status deployment/api-user-green -n autoclip-prod --timeout=300s
          
      - name: Run smoke tests on Green
        run: |
          npm run test:smoke -- --base-url https://green.autoclip.io
          
      - name: Switch traffic to Green
        run: |
          kubectl patch service api-user \
            -p '{"spec":{"selector":{"version":"green"}}}' \
            -n autoclip-prod
            
      - name: Monitor for 5 minutes
        run: |
          sleep 300
          # Check error rates
          ERROR_RATE=$(kubectl exec -n monitoring prometheus-0 -- \
            promql 'sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))')
          if (( $(echo "$ERROR_RATE > 0.01" | bc -l) )); then
            echo "Error rate too high, rolling back..."
            kubectl patch service api-user \
              -p '{"spec":{"selector":{"version":"blue"}}}' \
              -n autoclip-prod
            exit 1
          fi
          
      - name: Cleanup old Blue deployment
        run: |
          kubectl scale deployment api-user-blue --replicas=0 -n autoclip-prod
          
      - name: Create Sentry release
        uses: getsentry/action-release@v1
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: autoclip
          SENTRY_PROJECT: autoclip-api
        with:
          environment: production
          version: ${{ github.sha }}
          
      - name: Notify Slack
        uses: slackapi/slack-github-action@v1.24.0
        with:
          payload: |
            {
              "text": "🚀 Production deployment successful!",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Production Deployment*\n• Version: `${{ github.sha }}`\n• Author: ${{ github.actor }}\n• URL: https://app.autoclip.io"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 3.2 데이터베이스 마이그레이션 워크플로우

```yaml
# .github/workflows/db-migration.yml
name: Database Migration

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - staging
          - production
      action:
        description: 'Migration action'
        required: true
        type: choice
        options:
          - migrate
          - rollback
          - status

jobs:
  migration:
    name: Run Database Migration
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-2
          
      - name: Get database credentials
        id: db-creds
        run: |
          DB_SECRET=$(aws secretsmanager get-secret-value \
            --secret-id autoclip-${{ github.event.inputs.environment }}-db \
            --query SecretString --output text)
          echo "::add-mask::$DB_SECRET"
          echo "DATABASE_URL=$DB_SECRET" >> $GITHUB_OUTPUT
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run migration
        run: |
          case "${{ github.event.inputs.action }}" in
            migrate)
              npm run db:migrate
              ;;
            rollback)
              npm run db:rollback
              ;;
            status)
              npm run db:status
              ;;
          esac
        env:
          DATABASE_URL: ${{ steps.db-creds.outputs.DATABASE_URL }}
          
      - name: Notify result
        uses: slackapi/slack-github-action@v1.24.0
        with:
          payload: |
            {
              "text": "Database migration completed",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*DB Migration*\n• Environment: ${{ github.event.inputs.environment }}\n• Action: ${{ github.event.inputs.action }}\n• Status: ✅ Success"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 3.3 n8n 워크플로우 배포

```yaml
# .github/workflows/n8n-deploy.yml
name: n8n Workflow Deploy

on:
  push:
    paths:
      - 'n8n/workflows/**'
    branches:
      - main
      - develop

jobs:
  deploy-workflows:
    name: Deploy n8n Workflows
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          
      - name: Validate workflow files
        run: |
          for file in n8n/workflows/*.json; do
            echo "Validating $file..."
            node scripts/validate-n8n-workflow.js "$file"
          done
          
      - name: Deploy to n8n
        run: |
          ENVIRONMENT=$([[ "${{ github.ref }}" == "refs/heads/main" ]] && echo "production" || echo "staging")
          N8N_URL=$([[ "$ENVIRONMENT" == "production" ]] && echo "${{ secrets.N8N_PROD_URL }}" || echo "${{ secrets.N8N_STAGING_URL }}")
          
          for file in n8n/workflows/*.json; do
            WORKFLOW_ID=$(jq -r '.id' "$file")
            echo "Deploying workflow $WORKFLOW_ID..."
            
            curl -X PUT "$N8N_URL/api/v1/workflows/$WORKFLOW_ID" \
              -H "X-N8N-API-KEY: ${{ secrets.N8N_API_KEY }}" \
              -H "Content-Type: application/json" \
              -d @"$file"
              
            # Activate workflow
            curl -X POST "$N8N_URL/api/v1/workflows/$WORKFLOW_ID/activate" \
              -H "X-N8N-API-KEY: ${{ secrets.N8N_API_KEY }}"
          done
```

---

## 4. Kubernetes 매니페스트

### 4.1 디렉토리 구조
```
k8s/
├── base/
│   ├── api-user/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── hpa.yaml
│   ├── api-content/
│   ├── api-project/
│   ├── web/
│   └── n8n/
├── overlays/
│   ├── staging/
│   │   ├── kustomization.yaml
│   │   └── patches/
│   └── production/
│       ├── kustomization.yaml
│       └── patches/
└── argocd/
    ├── application-staging.yaml
    └── application-production.yaml
```

### 4.2 기본 Deployment 예시

```yaml
# k8s/base/api-content/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-content
  labels:
    app: api-content
    tier: backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api-content
  template:
    metadata:
      labels:
        app: api-content
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3003"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: api-content
      containers:
        - name: api-content
          image: ghcr.io/autoclip/api-content:latest
          ports:
            - containerPort: 3003
              name: http
          env:
            - name: NODE_ENV
              value: production
            - name: PORT
              value: "3003"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: url
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: redis-credentials
                  key: url
            - name: GEMINI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: api-keys
                  key: gemini
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3003
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3003
            initialDelaySeconds: 5
            periodSeconds: 5
          securityContext:
            runAsNonRoot: true
            runAsUser: 1000
            readOnlyRootFilesystem: true
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: api-content
                topologyKey: kubernetes.io/hostname
```

### 4.3 HPA (Horizontal Pod Autoscaler)

```yaml
# k8s/base/api-content/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-content-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-content
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: 100
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
        - type: Pods
          value: 4
          periodSeconds: 15
      selectPolicy: Max
```

### 4.4 Kustomization (Production)

```yaml
# k8s/overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: autoclip-prod

resources:
  - ../../base/api-user
  - ../../base/api-content
  - ../../base/api-project
  - ../../base/web
  - ../../base/n8n

patches:
  - path: patches/replicas.yaml
  - path: patches/resources.yaml

configMapGenerator:
  - name: app-config
    literals:
      - LOG_LEVEL=info
      - ENVIRONMENT=production

secretGenerator:
  - name: api-keys
    envs:
      - secrets.env

images:
  - name: ghcr.io/autoclip/api-content
    newTag: main-abc123
  - name: ghcr.io/autoclip/api-user
    newTag: main-abc123
```

---

## 5. ArgoCD 설정

### 5.1 Application 정의

```yaml
# k8s/argocd/application-production.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: autoclip-production
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: default
  source:
    repoURL: https://github.com/autoclip/autoclip
    targetRevision: main
    path: k8s/overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: autoclip-prod
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
  revisionHistoryLimit: 10
```

---

## 6. 환경 설정

### 6.1 환경변수 구조

```yaml
# 공통 환경변수
Common:
  NODE_ENV: production | staging | development
  LOG_LEVEL: error | warn | info | debug
  PORT: 3000
  
# 데이터베이스
Database:
  DATABASE_URL: postgresql://...
  DATABASE_POOL_SIZE: 20
  
# Redis
Redis:
  REDIS_URL: redis://...
  REDIS_CLUSTER_MODE: true | false
  
# 외부 API
External APIs:
  GEMINI_API_KEY: xxx
  ELEVENLABS_API_KEY: xxx
  CREATOMATE_API_KEY: xxx
  YOUTUBE_CLIENT_ID: xxx
  YOUTUBE_CLIENT_SECRET: xxx
  
# 보안
Security:
  JWT_SECRET: xxx
  JWT_EXPIRES_IN: 900
  ENCRYPTION_KEY: xxx
  
# 모니터링
Monitoring:
  SENTRY_DSN: xxx
  DATADOG_API_KEY: xxx
```

### 6.2 시크릿 관리 (AWS Secrets Manager)

```yaml
# 시크릿 구조
secrets:
  autoclip-staging-db:
    url: postgresql://...
    
  autoclip-staging-api-keys:
    gemini: xxx
    elevenlabs: xxx
    creatomate: xxx
    
  autoclip-prod-db:
    url: postgresql://...
    
  autoclip-prod-api-keys:
    gemini: xxx
    elevenlabs: xxx
    creatomate: xxx
```

---

## 7. 모니터링 및 알림

### 7.1 배포 알림 설정

```yaml
# Slack 알림 채널
Channels:
  #deploy-staging:
    - 스테이징 배포 시작/완료/실패
    - 스테이징 테스트 결과
    
  #deploy-production:
    - 프로덕션 배포 시작/완료/실패
    - 롤백 알림
    - 에러율 경고
    
  #alerts-critical:
    - 프로덕션 장애
    - 보안 이슈
    - SLA 위반
```

### 7.2 배포 대시보드

```yaml
Grafana Dashboards:
  - name: Deployment Overview
    panels:
      - Deployment Frequency (daily/weekly)
      - Lead Time for Changes
      - Change Failure Rate
      - Mean Time to Recovery (MTTR)
      
  - name: Current Deployment Status
    panels:
      - Active Deployments
      - Pod Health
      - Error Rates
      - Response Times
```

---

## 8. 롤백 절차

### 8.1 자동 롤백 조건

```yaml
Auto Rollback Triggers:
  - Error rate > 1% for 5 minutes
  - Latency p95 > 2s for 5 minutes
  - Pod crash loop > 3 times
  - Health check failures > 50%
```

### 8.2 수동 롤백 프로세스

```bash
# 1. 이전 버전으로 ArgoCD 롤백
argocd app rollback autoclip-production

# 2. 또는 kubectl로 직접 롤백
kubectl rollout undo deployment/api-content -n autoclip-prod

# 3. 특정 리비전으로 롤백
kubectl rollout undo deployment/api-content -n autoclip-prod --to-revision=3

# 4. 롤백 상태 확인
kubectl rollout status deployment/api-content -n autoclip-prod
```

---

## 9. 보안 체크리스트

### 9.1 CI/CD 보안

```yaml
Checklist:
  ☑ GitHub Actions secrets 사용
  ☑ OIDC 기반 AWS 인증
  ☑ 최소 권한 IAM 역할
  ☑ 이미지 서명 (Cosign)
  ☑ 취약점 스캔 필수
  ☑ 시크릿 스캔 (detect-secrets)
  ☑ SAST 분석 (Semgrep)
  ☑ 컨테이너 이미지 스캔 (Trivy)
```

### 9.2 런타임 보안

```yaml
Checklist:
  ☑ Pod Security Standards (Restricted)
  ☑ Network Policies
  ☑ Service Mesh (mTLS)
  ☑ Secrets 암호화 (KMS)
  ☑ Audit Logging
  ☑ Runtime 보안 (Falco)
```

---

**문서 버전**: 1.0  
**최종 수정일**: 2025-12-24  
**작성자**: DevOps Team
