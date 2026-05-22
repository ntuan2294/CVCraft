"""
LLM wrapper - tách config khỏi logic agent.
Dùng OpenAI API. Cho phép chọn cheap/strong model tùy task.
"""
import os
from typing import Type, TypeVar
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

T = TypeVar('T', bound=BaseModel)

_llm_cache: dict[str, ChatOpenAI] = {}


class LLMFactory:
    """
    Factory để tạo LLM theo task complexity.
    - 'cheap': cho task đơn giản -> gpt-4o-mini
    - 'strong': cho task phức tạp -> gpt-5.5
    """

    @staticmethod
    def get_llm(tier: str = "strong"):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY chưa được set trong environment")

        if tier in _llm_cache:
            return _llm_cache[tier]

        if tier == "cheap":
            llm = ChatOpenAI(
                model="gpt-4o-mini",
                temperature=0.3,
                max_tokens=800,
                api_key=api_key,
            )
        elif tier == "cheap_large":
            llm = ChatOpenAI(
                model="gpt-4o-mini",
                temperature=0.3,
                max_tokens=3000,
                api_key=api_key,
            )
        else:
            llm = ChatOpenAI(
                model="gpt-5.5",
                temperature=0.7,
                max_tokens=1500,
                api_key=api_key,
            )
        _llm_cache[tier] = llm
        return llm


def call_with_structured_output(
    llm,
    output_schema: Type[T],
    system_prompt: str,
    user_message: str,
) -> T:
    """Gọi LLM và parse output về Pydantic schema."""
    structured_llm = llm.with_structured_output(output_schema)
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_message),
    ]
    return structured_llm.invoke(messages)


def call_text(llm, system_prompt: str, user_message: str) -> str:
    """Gọi LLM trả về text thuần."""
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_message),
    ]
    response = llm.invoke(messages)
    return response.content
