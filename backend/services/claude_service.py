import anthropic
from config import settings
from typing import Optional
import json


class ClaudeService:
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = settings.CLAUDE_MODEL

    # ─── System prompt ────────────────────────────────────────────────────────

    def build_system_prompt(self, user_profile: dict) -> str:
        profile_section = ""

        if user_profile:
            parts = []

            if user_profile.get("height"):
                parts.append(f"身高：{user_profile['height']} cm")
            if user_profile.get("weight"):
                parts.append(f"体重：{user_profile['weight']} kg")
            if user_profile.get("body_type"):
                parts.append(f"体型：{user_profile['body_type']}")
            if user_profile.get("skin_tone"):
                parts.append(f"肤色：{user_profile['skin_tone']}")
            if user_profile.get("age_range"):
                parts.append(f"年龄段：{user_profile['age_range']}")
            if user_profile.get("budget_range"):
                budget_map = {"经济": "经济实惠（注重性价比）", "中等": "中等预算", "高端": "高端消费"}
                parts.append(f"预算：{budget_map.get(user_profile['budget_range'], user_profile['budget_range'])}")
            if user_profile.get("style_preferences"):
                try:
                    prefs = json.loads(user_profile["style_preferences"])
                    if prefs:
                        parts.append(f"风格偏好：{', '.join(prefs)}")
                except (json.JSONDecodeError, TypeError):
                    pass

            if parts:
                profile_section = "\n\n## 用户画像\n" + "\n".join(f"- {p}" for p in parts)
            else:
                profile_section = "\n\n## 用户画像\n- 尚未完善，请在对话中自然地引导用户分享相关信息"

        system_prompt = f"""你是一位专业的女性时尚穿搭顾问，名叫"时尚小助手"。你温柔、专业、有品味，擅长根据不同体型、肤色和场合给出具体可行的穿搭建议。{profile_section}

## 核心行为准则

1. **始终用中文回复**，语气亲切自然，像闺蜜聊天一样轻松但专业。

2. **建议要具体**：每次穿搭建议都要包含：
   - 具体颜色（如"奶油白"而不是"白色"）
   - 款式细节（如"高腰A字裙"、"宽松oversize毛衣"）
   - 面料选择（如"真丝、雪纺、棉麻"等）
   - 品牌类别参考（如"优衣库/ZARA平价款"或"轻奢品牌"）

3. **体型针对性**：根据用户的体型特征，在建议中自然地融入扬长避短的搭配技巧：
   - 沙漏型：突出腰线，平衡上下身比例
   - 苹果型：修饰腹部，转移视线到腿部或颈部
   - 梨形：平衡肩部与臀部，深色下装+亮色上装
   - 直筒型：创造曲线感，腰带/收腰款式为主
   - 倒三角型：弱化肩部宽度，增加下半身分量感

4. **自然收集信息**：如果用户画像信息不完整，在对话中找合适时机自然地询问缺失信息（如体型、身高、肤色等），不要一次问太多。

5. **图片分析**：
   - 如果用户上传了个人全身照：分析其体型特征、肤色，并给出针对性建议
   - 如果用户上传了服装/穿搭照：点评搭配，并给出改进或延伸建议
   - 先描述你看到的内容，再给出分析和建议

6. **场合意识**：主动了解穿搭场合（日常通勤、约会、正式场合、旅行等），给出场合适配的建议。

7. **肤色配色**：
   - 冷白皮：适合冷色调（薰衣草紫、宝蓝、玫瑰红）
   - 暖白皮：适合暖色调（奶白、杏色、驼色、橙红）
   - 小麦色：适合饱和色（橙色、黄绿、亮红）
   - 深色皮：适合高对比色（纯白、亮黄、鲜红、金色）

请记住：你的目标是让每位用户都能找到最适合自己的穿搭风格，建立自信。"""

        return system_prompt

    # ─── Main chat ───────────────────────────────────────────────────────────

    async def chat(
        self,
        message: str,
        conversation_history: list,
        user_profile: dict,
        image_base64: Optional[str] = None,
        image_media_type: Optional[str] = None,
    ) -> str:
        system_prompt = self.build_system_prompt(user_profile)

        # Build messages from history (last 10 messages for context window)
        messages = []
        recent_history = conversation_history[-10:] if len(conversation_history) > 10 else conversation_history

        for hist_msg in recent_history:
            messages.append({
                "role": hist_msg["role"],
                "content": hist_msg["content"],
            })

        # Build the current user message content
        if image_base64 and image_media_type:
            # Multimodal: image + text
            user_content = [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": image_media_type,
                        "data": image_base64,
                    },
                },
                {
                    "type": "text",
                    "text": message if message.strip() else "请帮我分析这张图片，给出穿搭建议。",
                },
            ]
        else:
            user_content = message

        messages.append({"role": "user", "content": user_content})

        response = self.client.messages.create(
            model=self.model,
            max_tokens=2048,
            system=system_prompt,
            messages=messages,
        )

        return response.content[0].text

    # ─── Analyze image for profile ────────────────────────────────────────────

    async def analyze_image_for_profile(
        self,
        image_base64: str,
        image_media_type: str,
    ) -> dict:
        """
        Ask Claude to analyze a full-body photo and extract body_type and skin_tone.
        Returns a dict with keys: body_type, skin_tone, analysis_text.
        """
        analysis_prompt = """请仔细分析这张照片，提取以下信息并以JSON格式返回：

1. body_type（体型）- 从以下选项中选择最匹配的一个：
   - "沙漏型"（肩宽≈臀宽，腰部明显收细）
   - "苹果型"（腹部较圆润，腰部不明显）
   - "梨形"（臀部宽于肩部）
   - "直筒型"（肩、腰、臀比例相近）
   - "倒三角型"（肩宽大于臀宽）

2. skin_tone（肤色）- 从以下选项中选择：
   - "冷白"（白皙偏粉，冷调）
   - "暖白"（白皙偏黄，暖调）
   - "小麦"（健康小麦色）
   - "深色"（深棕或深色皮肤）

3. analysis_text - 用中文写一段友好的体型分析说明（100字以内）

如果照片不够清晰或无法判断，对应字段返回null。

请严格按照以下JSON格式返回，不要有其他内容：
{
  "body_type": "体型值或null",
  "skin_tone": "肤色值或null",
  "analysis_text": "分析说明文字"
}"""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=512,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": image_media_type,
                                "data": image_base64,
                            },
                        },
                        {
                            "type": "text",
                            "text": analysis_prompt,
                        },
                    ],
                }
            ],
        )

        raw_text = response.content[0].text.strip()

        # Try to parse JSON from response
        try:
            # Sometimes Claude wraps JSON in markdown code blocks
            if "```json" in raw_text:
                raw_text = raw_text.split("```json")[1].split("```")[0].strip()
            elif "```" in raw_text:
                raw_text = raw_text.split("```")[1].split("```")[0].strip()

            result = json.loads(raw_text)
            return {
                "body_type": result.get("body_type"),
                "skin_tone": result.get("skin_tone"),
                "analysis_text": result.get("analysis_text", "分析完成，请查看结果。"),
            }
        except (json.JSONDecodeError, KeyError, IndexError):
            # If JSON parsing fails, return a graceful fallback
            return {
                "body_type": None,
                "skin_tone": None,
                "analysis_text": raw_text[:300] if raw_text else "无法解析分析结果，请重试。",
            }


claude_service = ClaudeService()
