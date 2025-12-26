import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@tubegenius/ui';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-tube-50 to-tube-100">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="text-5xl font-bold text-tube-900 mb-4">
            TubeGenius AI
          </h1>
          <p className="text-xl text-tube-700 mb-8 max-w-2xl mx-auto">
            AI 기반 유튜브 콘텐츠 자동 생성 플랫폼
            <br />
            시니어 건강 정보부터 금융, 테크까지 - 안전하고 수익성 높은 채널 운영
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard">
              <Button variant="tube" size="lg">
                대시보드 시작하기
              </Button>
            </Link>
            <Link href="/generator">
              <Button variant="outline" size="lg">
                콘텐츠 생성하기
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-tube-800">AI 스크립트 생성</CardTitle>
              <CardDescription>
                Google Gemini 기반 자동 스크립트 생성
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>✓ Hook-Body-CTA 구조</li>
                <li>✓ 시니어 친화적 언어</li>
                <li>✓ 30초 이내 생성</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-tube-800">안전 필터 시스템</CardTitle>
              <CardDescription>
                YMYL 콘텐츠 자동 검증 및 면책조항
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>✓ 금지 주제 자동 차단</li>
                <li>✓ 신뢰도 점수 표시</li>
                <li>✓ 자동 면책조항 삽입</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-tube-800">자동 업로드</CardTitle>
              <CardDescription>
                YouTube API 연동 자동 게시
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>✓ OAuth 채널 연결</li>
                <li>✓ 메타데이터 자동 생성</li>
                <li>✓ 예약 게시 지원</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Verticals */}
        <section className="text-center">
          <h2 className="text-2xl font-semibold text-tube-800 mb-6">
            지원 버티컬
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { name: '시니어 건강', color: 'bg-niche-senior-health' },
              { name: '금융 & 투자', color: 'bg-niche-finance' },
              { name: 'Tech & AI', color: 'bg-niche-tech-ai' },
              { name: '역사 스토리텔링', color: 'bg-niche-history' },
              { name: '상품 리뷰', color: 'bg-niche-commerce' },
            ].map((vertical) => (
              <span
                key={vertical.name}
                className={`${vertical.color} text-white px-4 py-2 rounded-full text-sm font-medium`}
              >
                {vertical.name}
              </span>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
