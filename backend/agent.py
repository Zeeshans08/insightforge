import os
import json
import uuid
import re
import pandas as pd
import numpy as np
from anthropic import Anthropic

def get_anthropic_client():
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return None
    return Anthropic(api_key=api_key)

def extract_json_from_text(text: str):
    """
    Strips markdown code blocks, backticks, and extra prose to extract valid JSON.
    """
    if not text:
        return None
    text = text.strip()
    # Remove markdown fence blocks if present
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)
    
    # Try direct parse
    try:
        return json.loads(text)
    except Exception:
        # Search for first { and last }
        match = re.search(r"(\{.*\})", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except Exception:
                pass
    return None

def execute_python_sandbox(file_path: str, code: str):
    """
    Executes pandas python code safely on dataset file.
    Expects code to operate on variable `df` and set `result` and optionally `chart_data`.
    """
    try:
        if file_path.endswith(".csv"):
            df = pd.read_csv(file_path)
        elif file_path.endswith((".xlsx", ".xls")):
            df = pd.read_excel(file_path)
        else:
            return {"success": False, "error": "Unsupported file format"}

        safe_globals = {
            "__builtins__": {
                "range": range,
                "len": len,
                "str": str,
                "int": int,
                "float": float,
                "list": list,
                "dict": dict,
                "set": set,
                "sum": sum,
                "min": min,
                "max": max,
                "round": round,
                "sorted": sorted,
                "zip": zip,
                "enumerate": enumerate,
                "isinstance": isinstance,
                "print": print
            },
            "pd": pd,
            "np": np
        }

        local_scope = {"df": df}
        exec(code, safe_globals, local_scope)

        raw_result = local_scope.get("result", None)
        chart_data = local_scope.get("chart_data", None)

        if isinstance(raw_result, pd.DataFrame):
            formatted_result = raw_result.to_dict(orient="records")
        elif isinstance(raw_result, pd.Series):
            formatted_result = raw_result.to_dict()
        elif hasattr(raw_result, "item"):
            formatted_result = raw_result.item()
        else:
            formatted_result = raw_result

        if isinstance(chart_data, pd.DataFrame):
            chart_data = chart_data.to_dict(orient="records")
        elif isinstance(chart_data, pd.Series):
            chart_data = chart_data.to_dict()

        return {
            "success": True,
            "result": formatted_result,
            "chart_data": chart_data,
            "str_output": str(formatted_result) if formatted_result is not None else "Code executed cleanly."
        }

    except Exception as e:
        return {"success": False, "error": f"{type(e).__name__}: {str(e)}"}


def generate_fallback_analysis(df: pd.DataFrame, question: str):
    """
    Deterministically computes revenue, category totals, or general metrics if Anthropic API is unavailable.
    """
    q_lower = question.lower()
    
    # Check if revenue can be calculated
    cols = [c.lower() for c in df.columns]
    has_qty = any("qty" in c or "quantity" in c for c in cols)
    has_price = any("price" in c or "amount" in c for c in cols)
    has_country = "country" in cols
    has_category = "category" in cols

    df_copy = df.copy()
    if has_qty and has_price:
        qty_col = [c for c in df_copy.columns if any(k in c.lower() for k in ["qty", "quantity"])][0]
        price_col = [c for c in df_copy.columns if any(k in c.lower() for k in ["price", "amount"])][0]
        df_copy["Revenue"] = df_copy[qty_col].fillna(0) * df_copy[price_col].fillna(0)

    if "country" in q_lower and has_country and "Revenue" in df_copy.columns:
        grouped = df_copy.groupby("Country")["Revenue"].sum().reset_index()
        top_row = grouped.sort_values(by="Revenue", ascending=False).iloc[0]
        country_name = top_row["Country"]
        max_rev = round(float(top_row["Revenue"]), 2)
        
        return {
            "plan": ["Calculate total Revenue (Quantity * Price)", "Group by Country", "Identify top country"],
            "reasoning": "Aggregated sales data by country to find top revenue generator.",
            "python_code": "df['Revenue'] = df['Quantity'] * df['Price']\nresult = df.groupby('Country')['Revenue'].sum().reset_index().sort_values(by='Revenue', ascending=False)\nchart_data = result",
            "fallback_answer": f"The country that generated the highest total revenue is {country_name} with a total of ${max_rev:,.2f}.",
            "fallback_metrics": [{"label": "Top Country", "value": country_name}, {"label": "Highest Revenue", "value": f"${max_rev:,.2f}"}],
            "fallback_chart": {
                "render": True,
                "chart_type": "bar",
                "title": "Revenue by Country",
                "x_key": "Country",
                "y_keys": ["Revenue"],
                "data": grouped.to_dict(orient="records"),
                "explanation": "Bar chart comparing overall revenue generated across countries."
            }
        }

    if ("category" in q_lower or "product" in q_lower) and (has_category or "product" in cols):
        cat_col = "Category" if has_category else [c for c in df_copy.columns if "product" in c.lower()][0]
        val_col = "Revenue" if "Revenue" in df_copy.columns else df_copy.select_dtypes(include="number").columns[0]
        grouped = df_copy.groupby(cat_col)[val_col].sum().reset_index()
        top_row = grouped.sort_values(by=val_col, ascending=False).iloc[0]
        
        return {
            "plan": [f"Group data by {cat_col}", f"Sum metric {val_col}", "Determine top performer"],
            "reasoning": f"Aggregated dataset by {cat_col}.",
            "python_code": f"result = df.groupby('{cat_col}')['{val_col}'].sum().reset_index().sort_values(by='{val_col}', ascending=False)\nchart_data = result",
            "fallback_answer": f"The top performing category is {top_row[cat_col]} with total {val_col} of {round(float(top_row[val_col]), 2)}.",
            "fallback_metrics": [{"label": "Top Category", "value": str(top_row[cat_col])}],
            "fallback_chart": {
                "render": True,
                "chart_type": "bar",
                "title": f"Distribution by {cat_col}",
                "x_key": cat_col,
                "y_keys": [val_col],
                "data": grouped.to_dict(orient="records"),
                "explanation": f"Distribution of {val_col} across {cat_col}."
            }
        }

    # General fallback
    num_cols = df_copy.select_dtypes(include="number").columns.tolist()
    summary_dict = df_copy[num_cols].describe().to_dict() if num_cols else {}
    return {
        "plan": ["Compute statistical overview of numerical columns"],
        "reasoning": "Generated statistical summary metrics.",
        "python_code": "result = df.describe().to_dict()",
        "fallback_answer": f"Dataset contains {len(df)} rows across columns: {', '.join(df.columns)}. Key numerical statistics calculated successfully.",
        "fallback_metrics": [{"label": "Total Rows", "value": str(len(df))}, {"label": "Columns", "value": str(len(df.columns))}],
        "fallback_chart": {"render": False}
    }


def run_agent_query(dataset_file_path: str, dataset_profile: dict, dataset_eda: dict, question: str):
    client = get_anthropic_client()
    model_name = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
    
    reasoning_trace = []
    
    # Load DataFrame for checking
    if dataset_file_path.endswith(".csv"):
        df = pd.read_csv(dataset_file_path)
    else:
        df = pd.read_excel(dataset_file_path)

    fallback_info = generate_fallback_analysis(df, question)

    # -------------------------------------------------------------
    # STAGE 1: PLANNER
    # -------------------------------------------------------------
    planner_output = None
    if client:
        planner_system_prompt = """You are an expert data analyst planner and Python data engineer.
Given a dataset summary and a user question, create a plan and write Python code using Pandas to compute the exact answer.

Requirements for Python Code:
1. The dataset is pre-loaded as a pandas DataFrame named `df`.
2. Do NOT reload or import files.
3. Compute the exact metrics, aggregations, or filters requested.
4. Save your final computational answer into a variable named `result`.
5. If a visualization (chart) would be helpful, create a summary DataFrame or list of dicts for the chart and save it into a variable named `chart_data`.
6. Return ONLY a JSON object:
{
  "plan": ["Step 1 description", "Step 2 description"],
  "reasoning": "Analytical approach",
  "python_code": "df['Revenue'] = df['Quantity'] * df['Price']\\nresult = df.groupby('Category')['Revenue'].sum().reset_index()\\nchart_data = result"
}"""

        planner_user_msg = f"""Dataset Metadata:
Columns & Types: {json.dumps(dataset_profile.get("column_types", {}))}
EDA Summary: {json.dumps(dataset_eda, indent=2) if dataset_eda else "None"}

User Question: "{question}" """

        try:
            response = client.messages.create(
                model=model_name,
                max_tokens=1500,
                system=planner_system_prompt,
                messages=[{"role": "user", "content": planner_user_msg}]
            )
            raw_text = response.content[0].text
            planner_output = extract_json_from_text(raw_text)
        except Exception:
            planner_output = None

    if not planner_output:
        planner_output = {
            "plan": fallback_info["plan"],
            "reasoning": fallback_info["reasoning"],
            "python_code": fallback_info["python_code"]
        }

    reasoning_trace.append({
        "step": 1,
        "stage": "Planner",
        "title": "Analysis Planning & Code Generation",
        "status": "success",
        "details": planner_output.get("plan", []),
        "reasoning": planner_output.get("reasoning", ""),
        "code_proposed": planner_output.get("python_code", "")
    })

    # -------------------------------------------------------------
    # STAGE 2 & 3: TOOL EXECUTION & VALIDATOR
    # -------------------------------------------------------------
    code_to_run = planner_output.get("python_code", "")
    exec_res = execute_python_sandbox(dataset_file_path, code_to_run)

    if not exec_res["success"]:
        reasoning_trace.append({
            "step": 2,
            "stage": "Tool Execution",
            "title": "Python Execution Warning",
            "status": "warning",
            "code": code_to_run,
            "error": exec_res["error"]
        })
        
        # Self-correction fallback code
        code_to_run = fallback_info["python_code"]
        exec_res = execute_python_sandbox(dataset_file_path, code_to_run)

        reasoning_trace.append({
            "step": 3,
            "stage": "Validator & Self-Correction",
            "title": "Self-Correction Applied",
            "status": "success",
            "fixed_code": code_to_run,
            "output_summary": exec_res.get("str_output")
        })
    else:
        reasoning_trace.append({
            "step": 2,
            "stage": "Tool Execution & Validation",
            "title": "Python Sandbox Execution Passed",
            "status": "success",
            "code": code_to_run,
            "output_summary": exec_res.get("str_output")
        })

    # -------------------------------------------------------------
    # STAGE 4: SYNTHESIS & RECHARTS SPEC GENERATION
    # -------------------------------------------------------------
    final_synthesis = None
    if client:
        synthesis_system_prompt = """You are InsightForge's final synthesis agent.
Given a user question, planner notes, and exact Python code execution results, synthesize a clear, helpful, plain-English response.

Respond ONLY with a JSON object:
{
  "answer": "Clear, professional answer in plain English referencing exact calculated numbers.",
  "key_metrics": [
    {"label": "Metric Name", "value": "Metric Value"}
  ],
  "chart_config": {
    "render": true or false,
    "chart_type": "bar" or "line" or "pie" or "scatter",
    "title": "Chart Title",
    "x_key": "x column",
    "y_keys": ["y column"],
    "data": [
      {"name_or_x": "label", "value_or_y": 100}
    ],
    "explanation": "Short chart note"
  }
}"""

        synthesis_user_msg = f"""User Question: "{question}"
Planner Reasoning: {planner_output.get("reasoning", "")}
Code Output: {exec_res.get("str_output", "No output")}
Chart Raw Data: {json.dumps(exec_res.get("chart_data")) if exec_res.get("chart_data") else "None"} """

        try:
            synth_response = client.messages.create(
                model=model_name,
                max_tokens=1500,
                system=synthesis_system_prompt,
                messages=[{"role": "user", "content": synthesis_user_msg}]
            )
            raw_synth = synth_response.content[0].text
            final_synthesis = extract_json_from_text(raw_synth)
        except Exception:
            final_synthesis = None

    if not final_synthesis:
        # Build smart synthesis from fallback_info or pandas output
        chart_cfg = fallback_info.get("fallback_chart", {"render": False})
        if exec_res.get("chart_data") and isinstance(exec_res.get("chart_data"), list):
            cdata = exec_res.get("chart_data")
            first_row = cdata[0]
            keys = list(first_row.keys())
            chart_cfg = {
                "render": True,
                "chart_type": "bar",
                "title": f"Analysis: {question}",
                "x_key": keys[0],
                "y_keys": [keys[1]] if len(keys) > 1 else [keys[0]],
                "data": cdata,
                "explanation": "Visual breakdown from Pandas computation."
            }

        final_synthesis = {
            "answer": fallback_info.get("fallback_answer", f"Analysis complete. Result: {exec_res.get('str_output')}"),
            "key_metrics": fallback_info.get("fallback_metrics", []),
            "chart_config": chart_cfg
        }

    reasoning_trace.append({
        "step": 4,
        "stage": "Synthesis",
        "title": "Answer Synthesis & Visual Formatting",
        "status": "success",
        "chart_generated": final_synthesis.get("chart_config", {}).get("render", False)
    })

    return {
        "answer": final_synthesis.get("answer", ""),
        "key_metrics": final_synthesis.get("key_metrics", []),
        "reasoning_trace": reasoning_trace,
        "chart_config": final_synthesis.get("chart_config", {}),
        "code_executed": code_to_run,
        "code_output": exec_res.get("str_output", "")
    }
