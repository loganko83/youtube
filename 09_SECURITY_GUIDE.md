# AutoClip Security Guide

## 문서 정보
- **버전**: 1.0.0
- **최종 수정일**: 2024-12-24
- **작성자**: AutoClip Security Team
- **대상 독자**: 개발자, DevOps, 보안 담당자

---

## 1. 보안 개요

### 1.1 보안 원칙

| 원칙 | 설명 |
|------|------|
| **최소 권한** | 필요한 최소한의 권한만 부여 |
| **심층 방어** | 다중 보안 계층 적용 |
| **제로 트러스트** | 모든 요청을 검증 |
| **보안 기본값** | 기본 설정이 안전하도록 구성 |

### 1.2 보안 아키텍처

```
Client → CloudFlare(CDN) → AWS WAF → API Gateway(Kong) → Application → Database
                                          ↓
                              [Rate Limit, Auth, IP Filter, Bot Detect]
```

---

## 2. 인증 및 권한 부여

### 2.1 JWT 인증

```typescript
const jwtConfig = {
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET,
    expiresIn: '15m',
    algorithm: 'HS256',
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d',
  },
};

interface JwtPayload {
  sub: string;          // User ID
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
  jti: string;          // JWT ID (for revocation)
}
```

### 2.2 역할 기반 접근 제어 (RBAC)

| 역할 | 설명 | 권한 |
|------|------|------|
| **owner** | 조직 소유자 | 모든 권한 |
| **admin** | 관리자 | 멤버 관리, 설정 변경 |
| **editor** | 편집자 | 콘텐츠 생성/수정/삭제 |
| **viewer** | 뷰어 | 읽기 전용 |

```typescript
const PERMISSIONS = {
  'project:create': ['owner', 'admin'],
  'project:read': ['owner', 'admin', 'editor', 'viewer'],
  'project:delete': ['owner'],
  'content:create': ['owner', 'admin', 'editor'],
  'content:publish': ['owner', 'admin', 'editor'],
  'member:invite': ['owner', 'admin'],
  'subscription:manage': ['owner'],
};
```

### 2.3 세션 관리

```typescript
const sessionConfig = {
  maxConcurrentSessions: 5,
  regenerateOnLogin: true,
  inactivityTimeout: 30 * 60 * 1000, // 30분
};

async function invalidateAllSessions(userId: string) {
  const keys = await redis.keys(`session:${userId}:*`);
  if (keys.length > 0) await redis.del(...keys);
}
```

---

## 3. 데이터 보안

### 3.1 암호화

#### 전송 중 암호화
- TLS 1.3 필수
- HSTS 헤더 적용
- 인증서 자동 갱신 (Let's Encrypt / ACM)

#### 저장 데이터 암호화
```typescript
// AES-256-GCM
class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';

  async encrypt(plaintext: string): Promise<string> {
    const dataKey = await this.kmsService.generateDataKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, dataKey.plaintext, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();

    return [dataKey.encryptedKey.toString('base64'), iv.toString('hex'), tag.toString('hex'), encrypted].join(':');
  }
}
```

### 3.2 민감 데이터 분류

| 분류 | 예시 | 암호화 | 보존 |
|------|------|--------|------|
| Public | 게시된 콘텐츠 | 전송 중 | 무기한 |
| Internal | 프로젝트 설정 | 전송 중 | 계정 활성 시 |
| Confidential | 사용자 이메일 | 전송+저장 | 삭제 후 30일 |
| Restricted | API 키, 결제 정보 | AES-256 | 법적 요구사항 |

### 3.3 시크릿 관리

```typescript
// AWS Secrets Manager
@Injectable()
export class SecretsService {
  private cache = new Map<string, { value: string; expiresAt: number }>();
  private readonly cacheTTL = 5 * 60 * 1000;

  async getSecret(name: string): Promise<string> {
    const cached = this.cache.get(name);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const response = await this.client.getSecretValue({ SecretId: name });
    this.cache.set(name, { value: response.SecretString, expiresAt: Date.now() + this.cacheTTL });
    return response.SecretString;
  }
}
```

---

## 4. 입력 검증

### 4.1 DTO 검증

```typescript
import { IsString, MinLength, MaxLength, IsUUID } from 'class-validator';
import * as sanitizeHtml from 'sanitize-html';

export function SanitizeHtml() {
  return Transform(({ value }) => 
    typeof value === 'string' ? sanitizeHtml(value, { allowedTags: [] }) : value
  );
}

export class CreateContentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @SanitizeHtml()
  title: string;

  @IsUUID()
  projectId: string;
}
```

### 4.2 보안 헤더

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.autoclip.io"],
      frameSrc: ["'none'"],
    },
  },
  hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
}));
```

---

## 5. API 보안

### 5.1 Rate Limiting

```typescript
const PLAN_LIMITS = {
  free: { rpm: 20, rpd: 100 },
  starter: { rpm: 60, rpd: 1000 },
  pro: { rpm: 120, rpd: 5000 },
  business: { rpm: 300, rpd: 20000 },
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const user = context.switchToHttp().getRequest().user;
    const plan = await this.subscriptionService.getPlan(user.id);
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
    
    const key = `rate:${user.id}:rpm`;
    const count = await this.redis.incr(key);
    if (count === 1) await this.redis.expire(key, 60);
    
    if (count > limits.rpm) throw new ThrottlerException();
    return true;
  }
}
```

### 5.2 API Key 관리

```typescript
async function generateApiKey(userId: string): Promise<{ key: string }> {
  const keyValue = `ak_${crypto.randomBytes(32).toString('hex')}`;
  const hashedKey = await bcrypt.hash(keyValue, 12);
  
  await prisma.apiKey.create({
    data: {
      userId,
      keyHash: hashedKey,
      prefix: keyValue.substring(0, 10),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  return { key: keyValue }; // 한 번만 반환
}
```

### 5.3 Webhook 서명 검증

```typescript
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(`sha256=${expected}`));
}
```

---

## 6. 인프라 보안

### 6.1 네트워크 보안

```hcl
# API Server - ALB에서만 접근 허용
resource "aws_security_group" "api" {
  ingress {
    from_port       = 3001
    to_port         = 3001
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Database - API 서버에서만 접근
resource "aws_security_group" "database" {
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.api.id]
  }
}
```

### 6.2 WAF 규칙

```hcl
resource "aws_wafv2_web_acl" "main" {
  name  = "autoclip-waf"
  scope = "REGIONAL"
  
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
  }

  rule {
    name     = "RateLimit"
    priority = 2
    action { block {} }
    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }
  }
}
```

### 6.3 Kubernetes 보안

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-policy
spec:
  podSelector:
    matchLabels:
      app: autoclip-api
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - port: 3001
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: postgresql
      ports:
        - port: 5432
```

---

## 7. 모니터링 및 감사

### 7.1 감사 로그

```typescript
@Injectable()
export class AuditService {
  async log(event: AuditEvent): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: event.userId,
        action: event.action,
        resource: event.resource,
        ipAddress: event.ip,
        userAgent: event.userAgent,
        status: event.status,
        timestamp: new Date(),
      },
    });

    if (this.isCritical(event)) {
      await this.alertService.send(event);
    }
  }

  private isCritical(event: AuditEvent): boolean {
    return ['auth:login_failed', 'user:deleted', 'api_key:revoked'].includes(event.action);
  }
}
```

### 7.2 보안 알림

```yaml
groups:
  - name: security
    rules:
      - alert: BruteForceAttempt
        expr: increase(failed_logins_total[5m]) > 10
        labels:
          severity: high

      - alert: UnusualApiActivity
        expr: rate(api_requests_total[5m]) > 100
        labels:
          severity: medium
```

---

## 8. 컴플라이언스

### 8.1 GDPR

```typescript
class GdprService {
  async exportUserData(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { projects: true, contents: true },
    });
  }

  async deleteUserData(userId: string) {
    await this.prisma.$transaction([
      this.prisma.content.deleteMany({ where: { createdById: userId } }),
      this.prisma.project.deleteMany({ where: { ownerId: userId } }),
      this.prisma.user.update({
        where: { id: userId },
        data: { email: `deleted_${userId}@deleted.local`, deletedAt: new Date() },
      }),
    ]);
  }
}
```

### 8.2 데이터 보존

| 데이터 | 보존 기간 | 처리 |
|--------|----------|------|
| 감사 로그 | 1년 | Glacier 아카이브 |
| 세션 | 30일 | 자동 삭제 |
| 삭제된 사용자 | 30일 | 완전 삭제 |

---

## 9. 보안 체크리스트

### 개발
- [ ] 입력 검증
- [ ] SQL Injection 방지
- [ ] XSS 방지
- [ ] 민감 데이터 암호화
- [ ] 안전한 비밀번호 해싱
- [ ] 의존성 취약점 스캔

### 배포
- [ ] TLS 1.3
- [ ] 보안 헤더 (HSTS, CSP)
- [ ] Secrets Manager 사용
- [ ] WAF 적용
- [ ] Rate Limiting

### 운영
- [ ] 정기 취약점 스캔
- [ ] 연간 침투 테스트
- [ ] 접근 권한 검토
- [ ] API 키 교체

---

## 10. 인시던트 대응

**프로세스**: 탐지 → 분류 → 격리 → 분석 → 제거 → 복구 → 개선

**연락처**:
- Security: security@autoclip.io
- On-Call: oncall@autoclip.io

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2024-12-24 | 초기 버전 |
