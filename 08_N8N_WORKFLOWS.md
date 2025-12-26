# AutoClip n8n Workflows Guide

## 문서 정보
- **버전**: 1.0.0
- **최종 수정일**: 2024-12-24
- **작성자**: AutoClip Development Team
- **대상 독자**: 개발자, DevOps

---

## 1. n8n 개요

### 1.1 n8n이란?

n8n은 오픈소스 워크플로우 자동화 도구로, AutoClip에서 AI 콘텐츠 생성 파이프라인의 핵심 오케스트레이션 레이어로 사용됩니다.

### 1.2 AutoClip에서의 역할

```
┌─────────────────────────────────────────────────────────────────┐
│                    AutoClip Architecture                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Backend API                      n8n Workflows                │
│   ┌─────────────┐                 ┌─────────────────┐          │
│   │   NestJS    │──── Trigger ───▶│ Content Gen     │          │
│   │   Server    │                 │ Workflow        │          │
│   └─────────────┘                 └────────┬────────┘          │
│         ▲                                  │                    │
│         │                                  ▼                    │
│         │                         ┌─────────────────┐          │
│         │                         │ External APIs   │          │
│         │                         │ • Gemini        │          │
│         │                         │ • ElevenLabs    │          │
│         │                         │ • Creatomate    │          │
│         │                         │ • YouTube       │          │
│         │                         └────────┬────────┘          │
│         │                                  │                    │
│         └────────── Webhook ───────────────┘                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 배포 구성

```yaml
# docker-compose.yml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=${N8N_HOST}
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - NODE_ENV=production
      - WEBHOOK_URL=${N8N_WEBHOOK_URL}
      - GENERIC_TIMEZONE=Asia/Seoul
      
      # Queue Mode (Production)
      - EXECUTIONS_MODE=queue
      - QUEUE_BULL_REDIS_HOST=${REDIS_HOST}
      - QUEUE_BULL_REDIS_PORT=${REDIS_PORT}
      - QUEUE_BULL_REDIS_PASSWORD=${REDIS_PASSWORD}
      
      # Database
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=${DB_HOST}
      - DB_POSTGRESDB_PORT=${DB_PORT}
      - DB_POSTGRESDB_DATABASE=${DB_NAME}
      - DB_POSTGRESDB_USER=${DB_USER}
      - DB_POSTGRESDB_PASSWORD=${DB_PASSWORD}
      
      # Security
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_BASIC_AUTH_USER}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_BASIC_AUTH_PASSWORD}
      
      # Encryption
      - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - autoclip-network

  n8n-worker:
    image: n8nio/n8n:latest
    restart: always
    command: worker
    environment:
      - EXECUTIONS_MODE=queue
      - QUEUE_BULL_REDIS_HOST=${REDIS_HOST}
      - QUEUE_BULL_REDIS_PORT=${REDIS_PORT}
      - QUEUE_BULL_REDIS_PASSWORD=${REDIS_PASSWORD}
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=${DB_HOST}
      - DB_POSTGRESDB_PORT=${DB_PORT}
      - DB_POSTGRESDB_DATABASE=${DB_NAME}
      - DB_POSTGRESDB_USER=${DB_USER}
      - DB_POSTGRESDB_PASSWORD=${DB_PASSWORD}
      - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - autoclip-network
    deploy:
      replicas: 3

volumes:
  n8n_data:

networks:
  autoclip-network:
    external: true
```

---

## 2. 메인 워크플로우

### 2.1 콘텐츠 생성 워크플로우

#### 워크플로우 다이어그램

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     Content Generation Workflow                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐   │
│  │ Webhook │───▶│  Fetch  │───▶│ Analyze │───▶│ Safety  │───▶│ Script  │   │
│  │ Trigger │    │  Data   │    │ Content │    │ Check   │    │  Gen    │   │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘   │
│                                                                    │         │
│       ┌────────────────────────────────────────────────────────────┘         │
│       ▼                                                                      │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐   │
│  │   TTS   │───▶│  Image  │───▶│  Video  │───▶│  Final  │───▶│ Webhook │   │
│  │  Audio  │    │   Gen   │    │  Render │    │  Check  │    │ Response│   │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### JSON 워크플로우 정의

```json
{
  "name": "AutoClip - Content Generation",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "content-generation",
        "responseMode": "responseNode",
        "options": {
          "rawBody": true
        }
      },
      "id": "webhook-trigger",
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [100, 300],
      "webhookId": "content-generation-webhook"
    },
    {
      "parameters": {
        "jsCode": "// Input validation and setup\nconst input = $input.first().json;\n\nconst { contentId, userId } = input;\n\nif (!contentId || !userId) {\n  throw new Error('Missing required parameters: contentId, userId');\n}\n\n// Fetch content details from AutoClip API\nconst contentResponse = await $http.request({\n  method: 'GET',\n  url: `${$env.AUTOCLIP_API_URL}/api/v1/internal/contents/${contentId}`,\n  headers: {\n    'Authorization': `Bearer ${$env.INTERNAL_API_KEY}`,\n    'Content-Type': 'application/json'\n  }\n});\n\nconst content = contentResponse.data;\n\nreturn {\n  contentId,\n  userId,\n  projectId: content.projectId,\n  title: content.title,\n  vertical: content.vertical,\n  format: content.format,\n  tone: content.tone,\n  targetPlatform: content.targetPlatform,\n  dataSources: content.dataSources,\n  customPrompt: content.customPrompt,\n  language: content.language || 'ko'\n};"
      },
      "id": "setup-node",
      "name": "Setup & Validation",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [300, 300]
    },
    {
      "parameters": {
        "jsCode": "// Fetch data from configured sources\nconst input = $input.first().json;\nconst { vertical, dataSources, language } = input;\n\nconst fetchedData = [];\n\nfor (const source of dataSources) {\n  try {\n    let data;\n    \n    switch (source.type) {\n      case 'yahoo_finance':\n        data = await fetchYahooFinance(source.config);\n        break;\n      case 'google_news':\n        data = await fetchGoogleNews(source.config, language);\n        break;\n      case 'pubmed':\n        data = await fetchPubMed(source.config);\n        break;\n      case 'youtube_channel':\n        data = await fetchYouTubeChannel(source.config);\n        break;\n      case 'custom_rss':\n        data = await fetchCustomRSS(source.config);\n        break;\n      default:\n        console.log(`Unknown source type: ${source.type}`);\n        continue;\n    }\n    \n    fetchedData.push({\n      sourceType: source.type,\n      sourceName: source.name,\n      data,\n      fetchedAt: new Date().toISOString()\n    });\n  } catch (error) {\n    console.error(`Failed to fetch from ${source.type}: ${error.message}`);\n  }\n}\n\nasync function fetchYahooFinance(config) {\n  const { symbols } = config;\n  const response = await $http.request({\n    method: 'GET',\n    url: `https://query1.finance.yahoo.com/v8/finance/chart/${symbols[0]}`,\n    qs: { interval: '1d', range: '5d' }\n  });\n  return response.chart.result[0];\n}\n\nasync function fetchGoogleNews(config, language) {\n  const { query, maxResults = 5 } = config;\n  const response = await $http.request({\n    method: 'GET',\n    url: 'https://newsapi.org/v2/everything',\n    qs: {\n      q: query,\n      language: language === 'ko' ? 'ko' : 'en',\n      pageSize: maxResults,\n      sortBy: 'publishedAt',\n      apiKey: $env.NEWS_API_KEY\n    }\n  });\n  return response.articles;\n}\n\nasync function fetchPubMed(config) {\n  const { query, maxResults = 5 } = config;\n  // PubMed E-utilities API\n  const searchResponse = await $http.request({\n    method: 'GET',\n    url: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi',\n    qs: {\n      db: 'pubmed',\n      term: query,\n      retmax: maxResults,\n      retmode: 'json'\n    }\n  });\n  \n  const ids = searchResponse.esearchresult.idlist;\n  \n  if (ids.length === 0) return [];\n  \n  const summaryResponse = await $http.request({\n    method: 'GET',\n    url: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi',\n    qs: {\n      db: 'pubmed',\n      id: ids.join(','),\n      retmode: 'json'\n    }\n  });\n  \n  return Object.values(summaryResponse.result).filter(r => r.uid);\n}\n\nasync function fetchYouTubeChannel(config) {\n  const { channelId, maxResults = 5 } = config;\n  const response = await $http.request({\n    method: 'GET',\n    url: 'https://www.googleapis.com/youtube/v3/search',\n    qs: {\n      part: 'snippet',\n      channelId,\n      maxResults,\n      order: 'date',\n      type: 'video',\n      key: $env.YOUTUBE_API_KEY\n    }\n  });\n  return response.items;\n}\n\nasync function fetchCustomRSS(config) {\n  const { url } = config;\n  const response = await $http.request({\n    method: 'GET',\n    url,\n    headers: { 'Accept': 'application/rss+xml, application/xml' }\n  });\n  // RSS 파싱은 별도 XML 파서 필요\n  return response;\n}\n\nreturn {\n  ...input,\n  fetchedData,\n  dataFetchedAt: new Date().toISOString()\n};"
      },
      "id": "fetch-data",
      "name": "Fetch Data Sources",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [500, 300]
    },
    {
      "parameters": {
        "model": "gemini-2.0-flash-exp",
        "messages": {
          "values": [
            {
              "role": "system",
              "content": "You are an expert content analyst for {{$json.vertical}} topics. Analyze the provided data and extract key insights for creating engaging video content.\n\nYour task:\n1. Identify the most newsworthy/interesting topics\n2. Extract key facts and statistics\n3. Identify potential hooks for audience engagement\n4. Suggest content angles based on the target format ({{$json.format}})\n\nOutput Format (JSON):\n{\n  \"primaryTopic\": \"string\",\n  \"keyFacts\": [\"string\"],\n  \"statistics\": [{\"value\": \"string\", \"source\": \"string\"}],\n  \"hooks\": [\"string\"],\n  \"suggestedAngles\": [\"string\"],\n  \"targetAudience\": \"string\",\n  \"emotionalTone\": \"string\"\n}"
            },
            {
              "role": "user",
              "content": "Analyze this data for a {{$json.format}} video about {{$json.vertical}}:\n\n{{JSON.stringify($json.fetchedData, null, 2)}}\n\nCustom requirements: {{$json.customPrompt}}"
            }
          ]
        },
        "options": {
          "temperature": 0.3,
          "maxOutputTokens": 2048
        }
      },
      "id": "analyze-content",
      "name": "Analyze Content (Gemini)",
      "type": "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
      "typeVersion": 1,
      "position": [700, 300],
      "credentials": {
        "googleGeminiApi": {
          "id": "gemini-credentials",
          "name": "Google Gemini API"
        }
      }
    },
    {
      "parameters": {
        "jsCode": "// Safety Pre-Check\nconst input = $input.first().json;\nconst analysis = input.analysis || input;\n\n// 금지된 주제/키워드 체크\nconst FORBIDDEN_TOPICS = [\n  '도박', '성인', '불법', '마약', '폭력',\n  'gambling', 'adult', 'illegal', 'drug', 'violence'\n];\n\nconst SENSITIVE_HEALTH_CLAIMS = [\n  '암 치료', '당뇨 완치', '기적의 치료',\n  'cure cancer', 'cure diabetes', 'miracle cure'\n];\n\nconst contentText = JSON.stringify(analysis).toLowerCase();\n\n// Check forbidden topics\nfor (const topic of FORBIDDEN_TOPICS) {\n  if (contentText.includes(topic.toLowerCase())) {\n    return {\n      passed: false,\n      reason: `Forbidden topic detected: ${topic}`,\n      severity: 'high'\n    };\n  }\n}\n\n// Check sensitive health claims (for senior_health vertical)\nif (input.vertical === 'senior_health') {\n  for (const claim of SENSITIVE_HEALTH_CLAIMS) {\n    if (contentText.includes(claim.toLowerCase())) {\n      return {\n        passed: false,\n        reason: `Potentially harmful health claim: ${claim}`,\n        severity: 'medium',\n        suggestion: 'Rephrase as general wellness information with proper disclaimers'\n      };\n    }\n  }\n}\n\nreturn {\n  passed: true,\n  ...input\n};"
      },
      "id": "safety-precheck",
      "name": "Safety Pre-Check",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [900, 300]
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{$json.passed}}",
              "value2": true
            }
          ]
        }
      },
      "id": "safety-check-if",
      "name": "Safety Passed?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [1100, 300]
    },
    {
      "parameters": {
        "model": "gemini-2.0-flash-exp",
        "messages": {
          "values": [
            {
              "role": "system",
              "content": "You are an expert {{$json.vertical}} content scriptwriter for {{$json.format}} videos.\n\nFormat: {{$json.format}}\n- short: 30-60 seconds, punchy, hook-driven\n- long: 5-10 minutes, detailed, educational\n\nTone: {{$json.tone}}\n- informative: Educational, fact-based\n- entertaining: Fun, engaging, light\n- emotional: Story-driven, personal\n- professional: Formal, authoritative\n\nLanguage: {{$json.language}}\n\nIMPORTANT GUIDELINES:\n1. Start with a strong hook (question, surprising fact, or bold statement)\n2. Use simple language accessible to the target audience\n3. Include natural pauses for pacing [PAUSE]\n4. Add emphasis markers for key points [EMPHASIS]\n5. End with clear call-to-action\n6. For health content: Include disclaimers where appropriate\n\nOutput Format:\n{\n  \"title\": \"Video title\",\n  \"hook\": \"Opening hook (first 5 seconds)\",\n  \"script\": \"Full script with markers\",\n  \"scenes\": [\n    {\n      \"sceneNumber\": 1,\n      \"duration\": \"5s\",\n      \"narration\": \"Text to speak\",\n      \"visualDescription\": \"What should be shown\",\n      \"textOverlay\": \"On-screen text (optional)\"\n    }\n  ],\n  \"hashtags\": [\"relevant\", \"hashtags\"],\n  \"thumbnailConcept\": \"Thumbnail description\"\n}"
            },
            {
              "role": "user",
              "content": "Create a {{$json.format}} video script based on this analysis:\n\n{{JSON.stringify($json.analysis || $json, null, 2)}}\n\nTitle suggestion: {{$json.title}}\nCustom instructions: {{$json.customPrompt}}"
            }
          ]
        },
        "options": {
          "temperature": 0.7,
          "maxOutputTokens": 4096
        }
      },
      "id": "script-generation",
      "name": "Generate Script (Gemini)",
      "type": "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
      "typeVersion": 1,
      "position": [1300, 200],
      "credentials": {
        "googleGeminiApi": {
          "id": "gemini-credentials",
          "name": "Google Gemini API"
        }
      }
    },
    {
      "parameters": {
        "jsCode": "// Parse script and prepare for TTS\nconst input = $input.first().json;\nlet scriptData;\n\ntry {\n  // Extract JSON from Gemini response\n  const responseText = input.text || input.content || JSON.stringify(input);\n  const jsonMatch = responseText.match(/\\{[\\s\\S]*\\}/);\n  if (jsonMatch) {\n    scriptData = JSON.parse(jsonMatch[0]);\n  } else {\n    throw new Error('No JSON found in response');\n  }\n} catch (error) {\n  console.error('Failed to parse script:', error);\n  scriptData = {\n    title: input.title || 'Untitled',\n    script: input.text || input.content || '',\n    scenes: []\n  };\n}\n\n// Clean script for TTS (remove markers)\nconst cleanScript = scriptData.script\n  .replace(/\\[PAUSE\\]/g, '...')\n  .replace(/\\[EMPHASIS\\]/g, '')\n  .replace(/\\[.*?\\]/g, '');\n\n// Prepare scene narrations for individual TTS\nconst narrations = scriptData.scenes?.map((scene, index) => ({\n  sceneNumber: scene.sceneNumber || index + 1,\n  text: scene.narration,\n  duration: scene.duration\n})) || [{ sceneNumber: 1, text: cleanScript, duration: '60s' }];\n\nreturn {\n  ...input,\n  scriptData,\n  cleanScript,\n  narrations,\n  title: scriptData.title,\n  hashtags: scriptData.hashtags || [],\n  thumbnailConcept: scriptData.thumbnailConcept\n};"
      },
      "id": "parse-script",
      "name": "Parse Script",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1500, 200]
    },
    {
      "parameters": {
        "resource": "textToSpeech",
        "text": "={{$json.cleanScript}}",
        "voiceId": "={{$json.language === 'ko' ? 'jsCqWAovK2LkecY7zXl4' : '21m00Tcm4TlvDq8ikWAM'}}",
        "options": {
          "modelId": "eleven_multilingual_v2",
          "stability": 0.5,
          "similarityBoost": 0.75,
          "style": 0.3,
          "speakerBoost": true
        }
      },
      "id": "tts-elevenlabs",
      "name": "Generate Audio (ElevenLabs)",
      "type": "n8n-nodes-base.elevenLabs",
      "typeVersion": 1,
      "position": [1700, 200],
      "credentials": {
        "elevenLabsApi": {
          "id": "elevenlabs-credentials",
          "name": "ElevenLabs API"
        }
      }
    },
    {
      "parameters": {
        "jsCode": "// Upload audio to S3 and get URL\nconst input = $input.first();\nconst audioData = input.binary?.data || input.json.data;\n\nif (!audioData) {\n  throw new Error('No audio data received from TTS');\n}\n\nconst contentId = $('Setup & Validation').first().json.contentId;\nconst filename = `audio/${contentId}/${Date.now()}.mp3`;\n\n// Upload to S3\nconst s3Response = await $http.request({\n  method: 'PUT',\n  url: `${$env.S3_ENDPOINT}/${$env.S3_BUCKET}/${filename}`,\n  headers: {\n    'Content-Type': 'audio/mpeg',\n    'x-amz-acl': 'public-read'\n  },\n  body: Buffer.from(audioData, 'base64'),\n  returnFullResponse: true\n});\n\nconst audioUrl = `${$env.CDN_URL}/${filename}`;\n\nreturn {\n  ...$('Parse Script').first().json,\n  audioUrl,\n  audioFilename: filename\n};"
      },
      "id": "upload-audio",
      "name": "Upload Audio to S3",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1900, 200]
    },
    {
      "parameters": {
        "jsCode": "// Generate images for each scene\nconst input = $input.first().json;\nconst { scriptData, vertical, language } = input;\n\nconst scenes = scriptData.scenes || [];\nconst imagePrompts = [];\n\nfor (const scene of scenes) {\n  const visualDesc = scene.visualDescription;\n  \n  // Build optimized DALL-E prompt\n  const styleGuide = getStyleGuide(vertical);\n  const prompt = `${visualDesc}. ${styleGuide}. High quality, professional, suitable for ${vertical} content.`;\n  \n  imagePrompts.push({\n    sceneNumber: scene.sceneNumber,\n    prompt: prompt,\n    size: '1024x1024',\n    style: 'vivid'\n  });\n}\n\nfunction getStyleGuide(vertical) {\n  const guides = {\n    'senior_health': 'Warm, friendly, featuring diverse older adults, soft lighting, approachable medical/wellness imagery',\n    'finance': 'Professional, clean, modern charts and graphs, corporate aesthetic, blue tones',\n    'tech': 'Futuristic, sleek, digital elements, neon accents, cutting-edge feel',\n    'history': 'Vintage, documentary style, sepia or muted tones, archival feel'\n  };\n  return guides[vertical] || 'Professional, high quality, clean composition';\n}\n\nreturn {\n  ...input,\n  imagePrompts\n};"
      },
      "id": "prepare-images",
      "name": "Prepare Image Prompts",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [2100, 200]
    },
    {
      "parameters": {
        "batchSize": 1,
        "options": {
          "reset": false
        }
      },
      "id": "split-images",
      "name": "Split Image Prompts",
      "type": "n8n-nodes-base.splitInBatches",
      "typeVersion": 3,
      "position": [2300, 200]
    },
    {
      "parameters": {
        "operation": "generate",
        "prompt": "={{$json.prompt}}",
        "model": "dall-e-3",
        "size": "1024x1024",
        "quality": "standard",
        "style": "={{$json.style}}"
      },
      "id": "generate-image",
      "name": "Generate Image (DALL-E)",
      "type": "n8n-nodes-base.openAi",
      "typeVersion": 1,
      "position": [2500, 200],
      "credentials": {
        "openAiApi": {
          "id": "openai-credentials",
          "name": "OpenAI API"
        }
      }
    },
    {
      "parameters": {
        "jsCode": "// Upload generated image to S3\nconst input = $input.first().json;\nconst imageUrl = input.data?.[0]?.url || input.url;\n\nif (!imageUrl) {\n  throw new Error('No image URL received');\n}\n\n// Download image\nconst imageResponse = await $http.request({\n  method: 'GET',\n  url: imageUrl,\n  encoding: 'binary',\n  returnFullResponse: true\n});\n\nconst contentId = $('Setup & Validation').first().json.contentId;\nconst sceneNumber = input.sceneNumber || 1;\nconst filename = `images/${contentId}/scene_${sceneNumber}_${Date.now()}.png`;\n\n// Upload to S3\nawait $http.request({\n  method: 'PUT',\n  url: `${$env.S3_ENDPOINT}/${$env.S3_BUCKET}/${filename}`,\n  headers: {\n    'Content-Type': 'image/png',\n    'x-amz-acl': 'public-read'\n  },\n  body: imageResponse.body\n});\n\nconst s3ImageUrl = `${$env.CDN_URL}/${filename}`;\n\nreturn {\n  sceneNumber,\n  imageUrl: s3ImageUrl,\n  originalPrompt: input.prompt\n};"
      },
      "id": "upload-image",
      "name": "Upload Image to S3",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [2700, 200]
    },
    {
      "parameters": {
        "aggregate": "aggregateAllItemData",
        "destinationFieldName": "generatedImages",
        "include": "allFieldsExcept",
        "fieldsToExclude": "binary"
      },
      "id": "aggregate-images",
      "name": "Aggregate Images",
      "type": "n8n-nodes-base.aggregate",
      "typeVersion": 1,
      "position": [2900, 200]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://api.creatomate.com/v1/renders",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"template_id\": \"{{$env.CREATOMATE_TEMPLATE_ID}}\",\n  \"modifications\": {\n    \"Audio-1\": \"{{$json.audioUrl}}\",\n    {{#each $json.generatedImages}}\n    \"Image-{{this.sceneNumber}}\": \"{{this.imageUrl}}\",\n    {{/each}}\n    \"Title\": \"{{$json.title}}\",\n    \"Subtitle\": \"{{$json.scriptData.hook}}\"\n  },\n  \"metadata\": {\n    \"content_id\": \"{{$json.contentId}}\"\n  }\n}"
      },
      "id": "render-video",
      "name": "Render Video (Creatomate)",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [3100, 200],
      "credentials": {
        "httpHeaderAuth": {
          "id": "creatomate-credentials",
          "name": "Creatomate API"
        }
      }
    },
    {
      "parameters": {
        "jsCode": "// Poll for render completion\nconst input = $input.first().json;\nconst renderId = input.id;\n\nlet status = 'rendering';\nlet attempts = 0;\nconst maxAttempts = 60; // 5분 대기 (5초 * 60)\n\nwhile (status === 'rendering' && attempts < maxAttempts) {\n  await new Promise(resolve => setTimeout(resolve, 5000)); // 5초 대기\n  \n  const response = await $http.request({\n    method: 'GET',\n    url: `https://api.creatomate.com/v1/renders/${renderId}`,\n    headers: {\n      'Authorization': `Bearer ${$env.CREATOMATE_API_KEY}`\n    }\n  });\n  \n  status = response.status;\n  \n  if (status === 'succeeded') {\n    return {\n      success: true,\n      videoUrl: response.url,\n      duration: response.duration,\n      renderId\n    };\n  } else if (status === 'failed') {\n    throw new Error(`Video rendering failed: ${response.error_message}`);\n  }\n  \n  attempts++;\n}\n\nthrow new Error('Video rendering timed out');"
      },
      "id": "poll-render",
      "name": "Poll Render Status",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [3300, 200]
    },
    {
      "parameters": {
        "jsCode": "// Final safety check on generated content\nconst input = $input.first().json;\nconst setupData = $('Setup & Validation').first().json;\n\n// Check video accessibility\ntry {\n  const videoCheck = await $http.request({\n    method: 'HEAD',\n    url: input.videoUrl,\n    timeout: 10000\n  });\n  \n  if (videoCheck.statusCode !== 200) {\n    throw new Error('Video not accessible');\n  }\n} catch (error) {\n  return {\n    passed: false,\n    reason: 'Video file not accessible',\n    error: error.message\n  };\n}\n\n// Content length validation\nconst expectedDuration = setupData.format === 'short' ? { min: 15, max: 90 } : { min: 180, max: 900 };\n\nif (input.duration < expectedDuration.min || input.duration > expectedDuration.max) {\n  console.warn(`Video duration ${input.duration}s outside expected range ${expectedDuration.min}-${expectedDuration.max}s`);\n}\n\nreturn {\n  passed: true,\n  ...input,\n  contentId: setupData.contentId,\n  userId: setupData.userId\n};"
      },
      "id": "final-check",
      "name": "Final Safety Check",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [3500, 200]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={\n  \"success\": true,\n  \"contentId\": \"{{$json.contentId}}\",\n  \"videoUrl\": \"{{$json.videoUrl}}\",\n  \"thumbnailUrl\": \"{{$json.generatedImages[0]?.imageUrl}}\",\n  \"audioUrl\": \"{{$('Upload Audio to S3').first().json.audioUrl}}\",\n  \"scriptText\": \"{{$('Parse Script').first().json.cleanScript}}\",\n  \"duration\": {{$json.duration}},\n  \"metadata\": {\n    \"title\": \"{{$('Parse Script').first().json.title}}\",\n    \"hashtags\": {{JSON.stringify($('Parse Script').first().json.hashtags)}}\n  }\n}"
      },
      "id": "respond-success",
      "name": "Respond Success",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [3700, 200]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={\n  \"success\": false,\n  \"contentId\": \"{{$('Setup & Validation').first().json.contentId}}\",\n  \"error\": \"{{$json.reason || $json.message || 'Content generation failed'}}\",\n  \"severity\": \"{{$json.severity || 'high'}}\"\n}",
        "options": {
          "responseCode": 400
        }
      },
      "id": "respond-error",
      "name": "Respond Error",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1300, 400]
    }
  ],
  "connections": {
    "Webhook Trigger": {
      "main": [
        [
          {
            "node": "Setup & Validation",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Setup & Validation": {
      "main": [
        [
          {
            "node": "Fetch Data Sources",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Fetch Data Sources": {
      "main": [
        [
          {
            "node": "Analyze Content (Gemini)",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Analyze Content (Gemini)": {
      "main": [
        [
          {
            "node": "Safety Pre-Check",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Safety Pre-Check": {
      "main": [
        [
          {
            "node": "Safety Passed?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Safety Passed?": {
      "main": [
        [
          {
            "node": "Generate Script (Gemini)",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Respond Error",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Generate Script (Gemini)": {
      "main": [
        [
          {
            "node": "Parse Script",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Parse Script": {
      "main": [
        [
          {
            "node": "Generate Audio (ElevenLabs)",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Generate Audio (ElevenLabs)": {
      "main": [
        [
          {
            "node": "Upload Audio to S3",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Upload Audio to S3": {
      "main": [
        [
          {
            "node": "Prepare Image Prompts",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Prepare Image Prompts": {
      "main": [
        [
          {
            "node": "Split Image Prompts",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Split Image Prompts": {
      "main": [
        [
          {
            "node": "Generate Image (DALL-E)",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Aggregate Images",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Generate Image (DALL-E)": {
      "main": [
        [
          {
            "node": "Upload Image to S3",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Upload Image to S3": {
      "main": [
        [
          {
            "node": "Split Image Prompts",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Aggregate Images": {
      "main": [
        [
          {
            "node": "Render Video (Creatomate)",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Render Video (Creatomate)": {
      "main": [
        [
          {
            "node": "Poll Render Status",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Poll Render Status": {
      "main": [
        [
          {
            "node": "Final Safety Check",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Final Safety Check": {
      "main": [
        [
          {
            "node": "Respond Success",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1",
    "saveManualExecutions": true,
    "callerPolicy": "workflowsFromSameOwner",
    "errorWorkflow": "error-handler-workflow"
  },
  "staticData": null,
  "tags": [
    {
      "name": "production",
      "id": "1"
    },
    {
      "name": "content-generation",
      "id": "2"
    }
  ]
}
```

---

## 3. 보조 워크플로우

### 3.1 콘텐츠 게시 워크플로우

```json
{
  "name": "AutoClip - Content Publish",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "content-publish",
        "responseMode": "responseNode"
      },
      "id": "webhook-publish",
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [100, 300]
    },
    {
      "parameters": {
        "jsCode": "// Fetch content and channel details\nconst input = $input.first().json;\nconst { contentId, userId, platforms } = input;\n\n// Get content details\nconst contentResponse = await $http.request({\n  method: 'GET',\n  url: `${$env.AUTOCLIP_API_URL}/api/v1/internal/contents/${contentId}`,\n  headers: {\n    'Authorization': `Bearer ${$env.INTERNAL_API_KEY}`\n  }\n});\n\nconst content = contentResponse.data;\n\n// Get channel credentials for each platform\nconst channelCredentials = {};\n\nfor (const platform of platforms) {\n  const channelResponse = await $http.request({\n    method: 'GET',\n    url: `${$env.AUTOCLIP_API_URL}/api/v1/internal/projects/${content.projectId}/channels`,\n    qs: { platform },\n    headers: {\n      'Authorization': `Bearer ${$env.INTERNAL_API_KEY}`\n    }\n  });\n  \n  if (channelResponse.data.length > 0) {\n    channelCredentials[platform] = channelResponse.data[0];\n  }\n}\n\nreturn {\n  ...input,\n  content,\n  channelCredentials\n};"
      },
      "id": "setup-publish",
      "name": "Setup Publish",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [300, 300]
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{$json.platforms.includes('youtube')}}",
              "value2": true
            }
          ]
        }
      },
      "id": "check-youtube",
      "name": "Publish to YouTube?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [500, 200]
    },
    {
      "parameters": {
        "resource": "video",
        "operation": "upload",
        "title": "={{$json.content.title}}",
        "description": "={{$json.content.scriptText}}\\n\\n#{{$json.content.hashtags.join(' #')}}",
        "privacyStatus": "public",
        "categoryId": "={{$json.content.vertical === 'senior_health' ? '26' : '28'}}",
        "tags": "={{$json.content.hashtags.join(',')}}",
        "binaryPropertyName": "videoData"
      },
      "id": "upload-youtube",
      "name": "Upload to YouTube",
      "type": "n8n-nodes-base.youTube",
      "typeVersion": 1,
      "position": [700, 100],
      "credentials": {
        "youTubeOAuth2Api": {
          "id": "youtube-oauth",
          "name": "YouTube OAuth2"
        }
      }
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{$json.platforms.includes('tiktok')}}",
              "value2": true
            }
          ]
        }
      },
      "id": "check-tiktok",
      "name": "Publish to TikTok?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [500, 400]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://open.tiktokapis.com/v2/post/publish/video/init/",
        "authentication": "genericCredentialType",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "Bearer {{$json.channelCredentials.tiktok.accessToken}}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"post_info\": {\n    \"title\": \"{{$json.content.title}}\",\n    \"privacy_level\": \"PUBLIC_TO_EVERYONE\",\n    \"disable_duet\": false,\n    \"disable_comment\": false,\n    \"disable_stitch\": false\n  },\n  \"source_info\": {\n    \"source\": \"PULL_FROM_URL\",\n    \"video_url\": \"{{$json.content.videoUrl}}\"\n  }\n}"
      },
      "id": "upload-tiktok",
      "name": "Upload to TikTok",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [700, 400]
    },
    {
      "parameters": {
        "jsCode": "// Aggregate publish results\nconst results = {\n  youtube: null,\n  tiktok: null\n};\n\n// Check each input for results\nconst inputs = $input.all();\n\nfor (const item of inputs) {\n  if (item.json.id && item.json.snippet) {\n    // YouTube result\n    results.youtube = {\n      success: true,\n      videoId: item.json.id,\n      url: `https://youtube.com/watch?v=${item.json.id}`\n    };\n  }\n  \n  if (item.json.data?.publish_id) {\n    // TikTok result\n    results.tiktok = {\n      success: true,\n      publishId: item.json.data.publish_id\n    };\n  }\n}\n\nreturn {\n  contentId: $('Setup Publish').first().json.contentId,\n  results\n};"
      },
      "id": "aggregate-results",
      "name": "Aggregate Results",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [900, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{JSON.stringify($json)}}"
      },
      "id": "respond-publish",
      "name": "Respond",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1100, 300]
    }
  ],
  "connections": {
    "Webhook Trigger": {
      "main": [[{ "node": "Setup Publish", "type": "main", "index": 0 }]]
    },
    "Setup Publish": {
      "main": [
        [
          { "node": "Publish to YouTube?", "type": "main", "index": 0 },
          { "node": "Publish to TikTok?", "type": "main", "index": 0 }
        ]
      ]
    },
    "Publish to YouTube?": {
      "main": [
        [{ "node": "Upload to YouTube", "type": "main", "index": 0 }],
        [{ "node": "Aggregate Results", "type": "main", "index": 0 }]
      ]
    },
    "Upload to YouTube": {
      "main": [[{ "node": "Aggregate Results", "type": "main", "index": 0 }]]
    },
    "Publish to TikTok?": {
      "main": [
        [{ "node": "Upload to TikTok", "type": "main", "index": 0 }],
        [{ "node": "Aggregate Results", "type": "main", "index": 0 }]
      ]
    },
    "Upload to TikTok": {
      "main": [[{ "node": "Aggregate Results", "type": "main", "index": 0 }]]
    },
    "Aggregate Results": {
      "main": [[{ "node": "Respond", "type": "main", "index": 0 }]]
    }
  }
}
```

### 3.2 에러 핸들러 워크플로우

```json
{
  "name": "AutoClip - Error Handler",
  "nodes": [
    {
      "parameters": {
        "event": "workflow.error"
      },
      "id": "error-trigger",
      "name": "Error Trigger",
      "type": "n8n-nodes-base.errorTrigger",
      "typeVersion": 1,
      "position": [100, 300]
    },
    {
      "parameters": {
        "jsCode": "// Parse error information\nconst errorData = $input.first().json;\n\nconst errorInfo = {\n  workflowId: errorData.workflow?.id,\n  workflowName: errorData.workflow?.name,\n  executionId: errorData.execution?.id,\n  errorMessage: errorData.execution?.error?.message || 'Unknown error',\n  errorStack: errorData.execution?.error?.stack,\n  failedNode: errorData.execution?.lastNodeExecuted,\n  timestamp: new Date().toISOString(),\n  \n  // Extract content ID if available\n  contentId: extractContentId(errorData),\n  userId: extractUserId(errorData)\n};\n\nfunction extractContentId(data) {\n  try {\n    const inputData = data.execution?.data?.resultData?.runData;\n    for (const nodeData of Object.values(inputData || {})) {\n      if (nodeData[0]?.data?.main?.[0]?.[0]?.json?.contentId) {\n        return nodeData[0].data.main[0][0].json.contentId;\n      }\n    }\n  } catch (e) {}\n  return null;\n}\n\nfunction extractUserId(data) {\n  try {\n    const inputData = data.execution?.data?.resultData?.runData;\n    for (const nodeData of Object.values(inputData || {})) {\n      if (nodeData[0]?.data?.main?.[0]?.[0]?.json?.userId) {\n        return nodeData[0].data.main[0][0].json.userId;\n      }\n    }\n  } catch (e) {}\n  return null;\n}\n\nreturn errorInfo;"
      },
      "id": "parse-error",
      "name": "Parse Error",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [300, 300]
    },
    {
      "parameters": {
        "channel": "#alerts-n8n",
        "text": "🚨 *AutoClip Workflow Error*\n\n*Workflow:* {{$json.workflowName}}\n*Execution ID:* {{$json.executionId}}\n*Failed Node:* {{$json.failedNode}}\n*Error:* {{$json.errorMessage}}\n*Content ID:* {{$json.contentId || 'N/A'}}\n*Time:* {{$json.timestamp}}",
        "otherOptions": {
          "includeLinkToWorkflow": true
        }
      },
      "id": "slack-alert",
      "name": "Send Slack Alert",
      "type": "n8n-nodes-base.slack",
      "typeVersion": 2,
      "position": [500, 200],
      "credentials": {
        "slackApi": {
          "id": "slack-credentials",
          "name": "Slack API"
        }
      }
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{$json.contentId !== null}}",
              "value2": true
            }
          ]
        }
      },
      "id": "has-content-id",
      "name": "Has Content ID?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [500, 400]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{$env.AUTOCLIP_API_URL}}/api/v1/internal/contents/{{$json.contentId}}/status",
        "authentication": "genericCredentialType",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "Bearer {{$env.INTERNAL_API_KEY}}"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"status\": \"failed\",\n  \"errorMessage\": \"{{$json.errorMessage}}\",\n  \"failedAt\": \"{{$json.timestamp}}\"\n}"
      },
      "id": "update-content-status",
      "name": "Update Content Status",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [700, 400]
    },
    {
      "parameters": {
        "jsCode": "// Log to MongoDB for analysis\nconst errorInfo = $input.first().json;\n\nawait $http.request({\n  method: 'POST',\n  url: `${$env.MONGODB_DATA_API}/action/insertOne`,\n  headers: {\n    'Content-Type': 'application/json',\n    'api-key': $env.MONGODB_API_KEY\n  },\n  body: JSON.stringify({\n    dataSource: 'AutoClip',\n    database: 'autoclip',\n    collection: 'workflow_errors',\n    document: {\n      ...errorInfo,\n      createdAt: { $date: new Date().toISOString() }\n    }\n  })\n});\n\nreturn { logged: true };"
      },
      "id": "log-error",
      "name": "Log to MongoDB",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [700, 200]
    }
  ],
  "connections": {
    "Error Trigger": {
      "main": [[{ "node": "Parse Error", "type": "main", "index": 0 }]]
    },
    "Parse Error": {
      "main": [
        [
          { "node": "Send Slack Alert", "type": "main", "index": 0 },
          { "node": "Has Content ID?", "type": "main", "index": 0 }
        ]
      ]
    },
    "Send Slack Alert": {
      "main": [[{ "node": "Log to MongoDB", "type": "main", "index": 0 }]]
    },
    "Has Content ID?": {
      "main": [
        [{ "node": "Update Content Status", "type": "main", "index": 0 }],
        []
      ]
    }
  }
}
```

---

## 4. 버티컬별 템플릿 설정

### 4.1 시니어 건강 버티컬

```json
{
  "name": "senior_health",
  "displayName": "시니어 건강",
  "description": "고령자 대상 건강/웰니스 콘텐츠",
  "dataSources": {
    "default": [
      {
        "type": "pubmed",
        "config": {
          "query": "elderly health wellness prevention",
          "maxResults": 5
        }
      },
      {
        "type": "google_news",
        "config": {
          "query": "시니어 건강 웰빙",
          "maxResults": 5
        }
      }
    ]
  },
  "promptTemplates": {
    "analysis": {
      "systemPrompt": "You are a health content expert specializing in senior wellness. Focus on:\n- Evidence-based health information\n- Accessible language for older adults\n- Practical, actionable advice\n- Safety considerations\n\nAVOID:\n- Medical diagnoses or treatment recommendations\n- Unverified health claims\n- Potentially dangerous exercises without disclaimers",
      "outputFormat": "json"
    },
    "script": {
      "systemPrompt": "Create engaging health content for seniors (60+). Guidelines:\n- Use warm, respectful tone\n- Speak clearly and at moderate pace\n- Include disclaimers for medical content\n- Focus on prevention and wellness\n- Suggest consulting healthcare providers when appropriate",
      "hooks": [
        "오늘 알려드릴 건강 비법은...",
        "의사들이 추천하는 간단한 습관!",
        "60대부터 꼭 챙겨야 할 것은?",
        "건강 수명을 늘리는 비결!"
      ],
      "disclaimers": [
        "이 정보는 교육 목적으로 제공되며, 의학적 조언을 대체하지 않습니다.",
        "새로운 건강 프로그램을 시작하기 전에 담당 의사와 상담하세요."
      ]
    }
  },
  "voiceSettings": {
    "ko": {
      "voiceId": "jsCqWAovK2LkecY7zXl4",
      "name": "Yuna",
      "stability": 0.6,
      "similarityBoost": 0.8,
      "style": 0.2
    },
    "en": {
      "voiceId": "pNInz6obpgDQGcFmaJgB",
      "name": "Adam",
      "stability": 0.6,
      "similarityBoost": 0.8,
      "style": 0.2
    }
  },
  "imageStyle": {
    "guidelines": "Warm, friendly images featuring diverse older adults. Soft, natural lighting. Approachable medical/wellness imagery. Avoid clinical or sterile settings.",
    "colorPalette": ["#4A90A4", "#7CB342", "#FF8A65", "#FFFFFF"],
    "avoidElements": ["syringes", "hospitals", "sad expressions", "disability focus"]
  },
  "videoTemplate": {
    "aspectRatio": "9:16",
    "duration": {
      "short": { "min": 30, "max": 60 },
      "long": { "min": 300, "max": 600 }
    },
    "textOverlays": {
      "fontSize": "large",
      "fontWeight": "bold",
      "contrast": "high"
    },
    "transitions": "smooth",
    "musicStyle": "calm, uplifting"
  }
}
```

### 4.2 금융 버티컬

```json
{
  "name": "finance",
  "displayName": "금융/투자",
  "description": "금융 뉴스 및 투자 정보 콘텐츠",
  "dataSources": {
    "default": [
      {
        "type": "yahoo_finance",
        "config": {
          "symbols": ["^GSPC", "^IXIC", "^DJI", "AAPL", "GOOGL"],
          "interval": "1d"
        }
      },
      {
        "type": "google_news",
        "config": {
          "query": "stock market investing economy",
          "maxResults": 5
        }
      }
    ]
  },
  "promptTemplates": {
    "analysis": {
      "systemPrompt": "You are a financial content analyst. Focus on:\n- Market trends and data\n- Educational investment concepts\n- Economic indicators\n\nAVOID:\n- Specific investment recommendations\n- Guaranteed returns claims\n- Insider information references",
      "outputFormat": "json"
    },
    "script": {
      "systemPrompt": "Create informative financial content. Guidelines:\n- Present data objectively\n- Explain complex concepts simply\n- Include appropriate disclaimers\n- Avoid specific buy/sell recommendations",
      "hooks": [
        "오늘 시장이 움직인 이유는?",
        "투자자들이 주목하는 지표!",
        "이 숫자가 말해주는 것은?",
        "전문가들의 시장 전망!"
      ],
      "disclaimers": [
        "본 콘텐츠는 투자 조언이 아니며, 투자 결정은 본인의 판단하에 이루어져야 합니다.",
        "과거 수익률이 미래 수익을 보장하지 않습니다."
      ]
    }
  },
  "voiceSettings": {
    "ko": {
      "voiceId": "TxGEqnHWrfWFTfGW9XjX",
      "name": "Josh",
      "stability": 0.5,
      "similarityBoost": 0.75,
      "style": 0.3
    }
  },
  "imageStyle": {
    "guidelines": "Professional, clean, modern. Charts, graphs, financial imagery. Blue tones, corporate aesthetic.",
    "colorPalette": ["#1E3A5F", "#2E7D32", "#C62828", "#FFFFFF"],
    "avoidElements": ["gambling imagery", "extreme wealth displays"]
  },
  "videoTemplate": {
    "aspectRatio": "9:16",
    "duration": {
      "short": { "min": 30, "max": 60 },
      "long": { "min": 300, "max": 600 }
    },
    "textOverlays": {
      "fontSize": "medium",
      "fontWeight": "normal",
      "showCharts": true
    },
    "transitions": "quick",
    "musicStyle": "professional, dynamic"
  }
}
```

---

## 5. 환경 변수 설정

### 5.1 필수 환경 변수

```bash
# n8n Configuration
N8N_HOST=n8n.autoclip.io
N8N_PROTOCOL=https
N8N_PORT=5678
WEBHOOK_URL=https://n8n.autoclip.io

# Database (Queue Mode)
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=db.autoclip.io
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=n8n_user
DB_POSTGRESDB_PASSWORD=secure_password

# Redis (Queue Mode)
QUEUE_BULL_REDIS_HOST=redis.autoclip.io
QUEUE_BULL_REDIS_PORT=6379
QUEUE_BULL_REDIS_PASSWORD=redis_password

# Security
N8N_ENCRYPTION_KEY=your-32-character-encryption-key
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=secure_admin_password

# AutoClip API
AUTOCLIP_API_URL=https://api.autoclip.io
INTERNAL_API_KEY=internal_api_key_here

# External APIs
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
OPENAI_API_KEY=your_openai_api_key
CREATOMATE_API_KEY=your_creatomate_api_key
YOUTUBE_API_KEY=your_youtube_api_key
NEWS_API_KEY=your_news_api_key

# Storage
S3_ENDPOINT=https://s3.ap-northeast-2.amazonaws.com
S3_BUCKET=autoclip-content
CDN_URL=https://cdn.autoclip.io

# MongoDB (Logging)
MONGODB_DATA_API=https://data.mongodb-api.com/app/data-xxxxx/endpoint/data/v1
MONGODB_API_KEY=your_mongodb_api_key

# Slack (Alerts)
SLACK_BOT_TOKEN=xoxb-your-slack-token

# Creatomate Template
CREATOMATE_TEMPLATE_ID=your_template_id
```

---

## 6. 모니터링 & 로깅

### 6.1 실행 모니터링

```javascript
// Custom monitoring node
const executionStats = {
  workflowId: $workflow.id,
  workflowName: $workflow.name,
  executionId: $execution.id,
  startTime: $execution.startedAt,
  
  // Calculate metrics
  totalNodes: Object.keys($execution.data.resultData.runData).length,
  successfulNodes: 0,
  failedNodes: 0,
  
  // Cost tracking
  estimatedCost: {
    gemini: 0,
    elevenlabs: 0,
    openai: 0,
    creatomate: 0
  }
};

// Calculate node success/failure
for (const [nodeName, nodeData] of Object.entries($execution.data.resultData.runData)) {
  if (nodeData[0]?.error) {
    executionStats.failedNodes++;
  } else {
    executionStats.successfulNodes++;
  }
}

// Estimate API costs (approximate)
executionStats.estimatedCost.gemini = 0.002; // ~$0.002 per call
executionStats.estimatedCost.elevenlabs = 0.015; // ~$0.015 per generation
executionStats.estimatedCost.openai = 0.04; // ~$0.04 per image
executionStats.estimatedCost.creatomate = 0.20; // ~$0.20 per render

executionStats.totalEstimatedCost = Object.values(executionStats.estimatedCost).reduce((a, b) => a + b, 0);

return executionStats;
```

### 6.2 성능 메트릭

| 메트릭 | 목표값 | 알림 임계값 |
|--------|--------|------------|
| 워크플로우 성공률 | >95% | <90% |
| 평균 실행 시간 (숏폼) | <3분 | >5분 |
| 평균 실행 시간 (롱폼) | <10분 | >15분 |
| API 에러율 | <2% | >5% |
| 큐 대기 시간 | <30초 | >2분 |

---

## 7. 트러블슈팅

### 7.1 일반적인 문제

| 문제 | 원인 | 해결 방법 |
|------|------|----------|
| Webhook 타임아웃 | 긴 처리 시간 | Queue mode 사용, 비동기 처리 |
| 메모리 부족 | 대용량 미디어 처리 | Worker 메모리 증가, 스트리밍 처리 |
| API Rate Limit | 과도한 요청 | 요청 간격 조절, 캐싱 적용 |
| 인증 실패 | 토큰 만료 | OAuth 토큰 자동 갱신 설정 |

### 7.2 디버깅 가이드

```javascript
// Debug logging helper
function debugLog(stage, data) {
  console.log(`[${new Date().toISOString()}] [${stage}]`, JSON.stringify(data, null, 2));
  
  // Send to external logging if needed
  if ($env.DEBUG_MODE === 'true') {
    $http.request({
      method: 'POST',
      url: $env.DEBUG_WEBHOOK_URL,
      body: { stage, data, timestamp: new Date().toISOString() }
    }).catch(err => console.error('Debug log failed:', err));
  }
}

// Usage in nodes
debugLog('SCRIPT_GENERATION', {
  input: $input.first().json,
  vertical: $json.vertical,
  format: $json.format
});
```

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2024-12-24 | 초기 버전 |
