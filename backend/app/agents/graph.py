"""Bloomie AI pipeline - LangGraph state machine."""

from langgraph.graph import StateGraph, END

from .nodes import normalize_data, compute_baselines, detect_deviations, assess_risk, generate_narrative
from .state import BloomieState

workflow = StateGraph(BloomieState)

# Add nodes
workflow.add_node("normalize_data", normalize_data)
workflow.add_node("compute_baselines", compute_baselines)
workflow.add_node("detect_deviations", detect_deviations)
workflow.add_node("assess_risk", assess_risk)
workflow.add_node("generate_narrative", generate_narrative)

# Define edges
workflow.set_entry_point("normalize_data")
workflow.add_edge("normalize_data", "compute_baselines")
workflow.add_edge("compute_baselines", "detect_deviations")
workflow.add_edge("detect_deviations", "assess_risk")
workflow.add_edge("assess_risk", "generate_narrative")
workflow.add_edge("generate_narrative", END)

# Compile
graph = workflow.compile()
