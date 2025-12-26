import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Safety Filter Service - Enhanced YMYL Content Protection
 * Implements multi-layer safety checks for health and finance content
 */

interface SafetyIssue {
  type: 'forbidden_topic' | 'sensitive_claim' | 'ymyl_content' | 'low_confidence' | 'medical_advice' | 'financial_advice';
  severity: 'critical' | 'warning' | 'info';
  description: string;
  claimText?: string;
  suggestion?: string;
}

interface SafetyReport {
  passed: boolean;
  score: number; // 0-100, higher is safer
  issues: SafetyIssue[];
  disclaimerRequired: boolean;
  disclaimerText?: string;
  reviewRequired: boolean;
  autoApproved: boolean;
}

interface CriticalClaim {
  text: string;
  confidence: number;
  source?: string;
}

@Injectable()
export class SafetyFilterService {
  private readonly logger = new Logger(SafetyFilterService.name);

  // Forbidden topics - immediate rejection
  private readonly forbiddenTopics = {
    universal: [
      'gambling', 'casino', '도박', '카지노',
      'adult content', 'pornography', '성인물', '음란물',
      'illegal activities', 'crime instructions', '불법', '범죄 방법',
      'drugs', 'narcotics', '마약', '약물 남용',
      'violence', 'gore', '폭력', '잔인한',
      'hate speech', 'discrimination', '혐오', '차별',
      'terrorism', 'extremism', '테러', '극단주의',
      'self-harm', 'suicide', '자해', '자살',
    ],
    health: [
      'prescription medication', '처방약 추천',
      'cure guarantee', '완치 보장',
      'miracle treatment', '기적의 치료',
      'replace doctor', '의사 대체',
      'stop medication', '약 중단',
      'specific dosage', '복용량 처방',
      'diagnose', '진단하다',
    ],
    finance: [
      'guaranteed returns', '수익 보장',
      'get rich quick', '단기 고수익',
      'insider trading', '내부자 거래',
      'ponzi', 'pyramid', '다단계',
      'specific stock buy', '특정 종목 매수',
      'financial advice', '투자 조언',
    ],
  };

  // Sensitive patterns requiring enhanced review
  private readonly sensitivePatterns = {
    health: [
      /(?:암|cancer)\s*(?:치료|treatment|cure)/gi,
      /(?:당뇨|diabetes)\s*(?:완치|cure)/gi,
      /(?:고혈압|hypertension)\s*(?:낫|치료)/gi,
      /(?:약|medication|medicine)\s*(?:없이|without)/gi,
      /(?:100%|백퍼센트)\s*(?:효과|effective)/gi,
      /(?:부작용|side effects?)\s*(?:없|no|zero)/gi,
      /(?:의사|doctor)\s*(?:필요\s*없|not\s*need)/gi,
    ],
    finance: [
      /(?:\d+)%\s*(?:수익|return|profit)/gi,
      /(?:원금|principal)\s*(?:보장|guaranteed)/gi,
      /(?:무조건|definitely|certainly)\s*(?:오르|rise|up)/gi,
      /(?:손실|loss)\s*(?:없|no|zero)/gi,
      /(?:지금|now)\s*(?:당장|immediately)\s*(?:사|buy)/gi,
    ],
  };

  // Required disclaimers by vertical
  private readonly disclaimers = {
    'Senior Health': `
⚠️ 의료 면책 조항
이 영상은 일반적인 건강 정보 제공 목적으로만 제작되었습니다.
• 전문 의료 상담을 대체하지 않습니다
• 개인의 건강 상태에 따라 적용이 다를 수 있습니다
• 증상이 있으시면 반드시 의료 전문가와 상담하세요
• 약물 복용 전 담당 의사와 상의하세요
    `.trim(),
    'Finance & Investing': `
⚠️ 투자 면책 조항
이 영상은 교육 및 정보 제공 목적으로만 제작되었습니다.
• 투자 권유나 추천이 아닙니다
• 과거 수익률이 미래 수익을 보장하지 않습니다
• 투자 결정 전 반드시 전문가와 상담하세요
• 투자에 따른 손실 책임은 본인에게 있습니다
    `.trim(),
  };

  // Confidence thresholds
  private readonly thresholds = {
    autoApprove: 85,    // Above this, auto-approve
    review: 60,         // Between review and autoApprove, needs manual review
    reject: 40,         // Below this, reject
  };

  constructor(private readonly config: ConfigService) {}

  /**
   * Main safety check method
   */
  async check(
    content: {
      title?: string;
      script?: string;
      voiceoverText?: string;
      criticalClaims?: CriticalClaim[];
    },
    niche: string,
  ): Promise<SafetyReport> {
    const issues: SafetyIssue[] = [];
    let score = 100;

    // Layer 1: Forbidden topic check (immediate rejection)
    const forbiddenCheck = this.checkForbiddenTopics(content, niche);
    issues.push(...forbiddenCheck.issues);
    score -= forbiddenCheck.penalty;

    // Layer 2: Sensitive pattern check
    const patternCheck = this.checkSensitivePatterns(content, niche);
    issues.push(...patternCheck.issues);
    score -= patternCheck.penalty;

    // Layer 3: Critical claims confidence check
    if (content.criticalClaims) {
      const claimsCheck = this.checkClaimsConfidence(content.criticalClaims, niche);
      issues.push(...claimsCheck.issues);
      score -= claimsCheck.penalty;
    }

    // Layer 4: YMYL vertical check
    const ymylCheck = this.checkYMYLRequirements(content, niche);
    issues.push(...ymylCheck.issues);
    score -= ymylCheck.penalty;

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    // Determine pass/fail and review requirements
    const hasCriticalIssues = issues.some((i) => i.severity === 'critical');
    const passed = !hasCriticalIssues && score >= this.thresholds.reject;
    const reviewRequired = score < this.thresholds.autoApprove && score >= this.thresholds.reject;
    const autoApproved = score >= this.thresholds.autoApprove;

    // Determine disclaimer requirement
    const isYMYL = ['Senior Health', 'Finance & Investing'].includes(niche);
    const disclaimerRequired = isYMYL;
    const disclaimerText = disclaimerRequired ? this.disclaimers[niche as keyof typeof this.disclaimers] : undefined;

    const report: SafetyReport = {
      passed,
      score,
      issues,
      disclaimerRequired,
      disclaimerText,
      reviewRequired,
      autoApproved,
    };

    this.logger.log(`Safety check completed: score=${score}, passed=${passed}, issues=${issues.length}`);

    return report;
  }

  /**
   * Pre-check topic before generation (fast check)
   */
  async preCheck(topic: string, niche: string): Promise<{ allowed: boolean; reason?: string }> {
    const textToCheck = topic.toLowerCase();

    // Check universal forbidden topics
    for (const term of this.forbiddenTopics.universal) {
      if (textToCheck.includes(term.toLowerCase())) {
        return {
          allowed: false,
          reason: `Topic contains forbidden content: ${term}`,
        };
      }
    }

    // Check niche-specific forbidden topics
    const nicheKey = niche === 'Senior Health' ? 'health' : niche === 'Finance & Investing' ? 'finance' : null;
    if (nicheKey && this.forbiddenTopics[nicheKey]) {
      for (const term of this.forbiddenTopics[nicheKey]) {
        if (textToCheck.includes(term.toLowerCase())) {
          return {
            allowed: false,
            reason: `Topic not allowed for ${niche}: ${term}`,
          };
        }
      }
    }

    return { allowed: true };
  }

  private checkForbiddenTopics(
    content: { title?: string; script?: string; voiceoverText?: string },
    niche: string,
  ): { issues: SafetyIssue[]; penalty: number } {
    const issues: SafetyIssue[] = [];
    let penalty = 0;

    const textToCheck = [
      content.title || '',
      content.script || '',
      content.voiceoverText || '',
    ].join(' ').toLowerCase();

    // Check universal forbidden topics
    for (const term of this.forbiddenTopics.universal) {
      if (textToCheck.includes(term.toLowerCase())) {
        issues.push({
          type: 'forbidden_topic',
          severity: 'critical',
          description: `Forbidden content detected: "${term}"`,
          suggestion: 'Remove or replace this content entirely',
        });
        penalty += 100; // Immediate fail
      }
    }

    // Check niche-specific forbidden topics
    const nicheKey = niche === 'Senior Health' ? 'health' : niche === 'Finance & Investing' ? 'finance' : null;
    if (nicheKey && this.forbiddenTopics[nicheKey]) {
      for (const term of this.forbiddenTopics[nicheKey]) {
        if (textToCheck.includes(term.toLowerCase())) {
          issues.push({
            type: nicheKey === 'health' ? 'medical_advice' : 'financial_advice',
            severity: 'critical',
            description: `${niche} forbidden content: "${term}"`,
            suggestion: `Rephrase to avoid ${nicheKey === 'health' ? 'medical' : 'financial'} advice`,
          });
          penalty += 50;
        }
      }
    }

    return { issues, penalty };
  }

  private checkSensitivePatterns(
    content: { title?: string; script?: string; voiceoverText?: string },
    niche: string,
  ): { issues: SafetyIssue[]; penalty: number } {
    const issues: SafetyIssue[] = [];
    let penalty = 0;

    const textToCheck = [
      content.title || '',
      content.script || '',
      content.voiceoverText || '',
    ].join(' ');

    const nicheKey = niche === 'Senior Health' ? 'health' : niche === 'Finance & Investing' ? 'finance' : null;

    if (nicheKey && this.sensitivePatterns[nicheKey]) {
      for (const pattern of this.sensitivePatterns[nicheKey]) {
        const matches = textToCheck.match(pattern);
        if (matches) {
          issues.push({
            type: 'sensitive_claim',
            severity: 'warning',
            description: `Sensitive pattern detected: "${matches[0]}"`,
            claimText: matches[0],
            suggestion: 'Consider adding qualifiers or removing absolute claims',
          });
          penalty += 10;
        }
      }
    }

    return { issues, penalty };
  }

  private checkClaimsConfidence(
    claims: CriticalClaim[],
    niche: string,
  ): { issues: SafetyIssue[]; penalty: number } {
    const issues: SafetyIssue[] = [];
    let penalty = 0;

    const isYMYL = ['Senior Health', 'Finance & Investing'].includes(niche);
    const minConfidence = isYMYL ? 70 : 50;

    for (const claim of claims) {
      if (claim.confidence < minConfidence) {
        const severity = claim.confidence < 40 ? 'critical' : 'warning';
        issues.push({
          type: 'low_confidence',
          severity,
          description: `Low confidence claim (${claim.confidence}%): "${claim.text.substring(0, 50)}..."`,
          claimText: claim.text,
          suggestion: claim.source
            ? 'Verify claim with additional sources'
            : 'Add source citation for this claim',
        });
        penalty += severity === 'critical' ? 20 : 10;
      }

      // Extra penalty for YMYL claims without sources
      if (isYMYL && !claim.source) {
        issues.push({
          type: 'ymyl_content',
          severity: 'warning',
          description: `YMYL claim without source: "${claim.text.substring(0, 50)}..."`,
          claimText: claim.text,
          suggestion: 'Add credible source for YMYL content claims',
        });
        penalty += 5;
      }
    }

    return { issues, penalty };
  }

  private checkYMYLRequirements(
    content: { title?: string; script?: string },
    niche: string,
  ): { issues: SafetyIssue[]; penalty: number } {
    const issues: SafetyIssue[] = [];
    let penalty = 0;

    const isYMYL = ['Senior Health', 'Finance & Investing'].includes(niche);

    if (isYMYL) {
      issues.push({
        type: 'ymyl_content',
        severity: 'info',
        description: `${niche} is a YMYL (Your Money or Your Life) vertical - enhanced verification applied`,
        suggestion: 'Ensure all claims are verifiable and include appropriate disclaimers',
      });

      // Check for required disclaimer phrases in script
      const script = (content.script || '').toLowerCase();
      const hasDisclaimer =
        script.includes('전문가') ||
        script.includes('상담') ||
        script.includes('의사') ||
        script.includes('주의');

      if (!hasDisclaimer) {
        issues.push({
          type: 'ymyl_content',
          severity: 'warning',
          description: 'Script may be missing professional consultation recommendation',
          suggestion: 'Add recommendation to consult professionals',
        });
        penalty += 5;
      }
    }

    return { issues, penalty };
  }
}
