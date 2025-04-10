# file: my_rag_app/local_guardrails.py

from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

class LocalGuardrails:
    """Guardrails implementation using local components with LangChain."""
    
    def __init__(self, llm_callable):
        """
        Initialize guardrails with the provided callable LLM function.
        
        Args:
            llm_callable: A callable that takes a prompt (str) and returns a response (str).
        """
        self.llm = llm_callable  # This callable (e.g. the 'invoke' method) is used if you want to check input/output

        # Input guardrails prompt (not actively used)
        self.input_check_prompt = PromptTemplate.from_template(
            """You are a content safety filter for a medical chatbot.
Evaluate if the following user input is safe and appropriate:

USER INPUT: {input}

Respond with ONLY "SAFE" if the content is appropriate.
If not safe, respond with "UNSAFE: [brief reason]".
"""
        )
        
        # Output guardrails prompt (this chain is now a safe‑pass)
        self.output_check_prompt = PromptTemplate.from_template(
            """You are a content safety filter for a medical chatbot.
Review the following chatbot response:

User Query: {user_input}
Chatbot Response: {output}

If the response is safe, respond with "SAFE".
Otherwise, respond with a short warning.
"""
        )
        
        # Create the chains using the pipe operator.
        # (In our current flow we will call check_output() but not rely on the chain to re‑invoke the LLM.)
        self.input_guardrail_chain = (
            self.input_check_prompt
            | self.llm
            | StrOutputParser()
        )
        self.output_guardrail_chain = (
            self.output_check_prompt
            | self.llm
            | StrOutputParser()
        )
    
    def check_input(self, user_input: str) -> tuple[bool, str]:
        # For our purposes, we assume all input is safe.
        return True, user_input
    
    def check_output(self, output: str, user_input: str = "") -> str:
        # Simply return the output without re‑invoking the LLM.
        return output
