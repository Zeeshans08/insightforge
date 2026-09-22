import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_pdf_report(dataset_info: dict, output_path: str, agent_sessions: list = None):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor("#1e1b4b"),
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=15
    )

    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#4338ca"),
        spaceBefore=12,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#334155")
    )

    elements = []

    
    elements.append(Paragraph("InsightForge Executive Data Report", title_style))
    filename = dataset_info.get("filename", "Dataset Report")
    elements.append(Paragraph(f"Dataset: <b>{filename}</b> | Generated automatically by InsightForge Agentic Platform", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#6366f1"), spaceBefore=0, spaceAfter=15))

    
    profile = dataset_info.get("profile", {})
    elements.append(Paragraph("1. Dataset Summary", h2_style))
    
    summary_data = [
        ["Total Rows", str(profile.get("rows", 0)), "Total Columns", str(profile.get("columns", 0))],
        ["Missing Values", str(sum(profile.get("missing_values", {}).values())), "Cleaned Status", "Ready" if dataset_info.get("cleaned_path") else "Raw"]
    ]
    
    summary_table = Table(summary_data, colWidths=[120, 150, 120, 150])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor("#1e293b")),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('PADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0"))
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 15))

    
    eda = dataset_info.get("eda", {})
    if eda:
        elements.append(Paragraph("2. Key Numerical Statistics", h2_style))
        num_summary = eda.get("numeric_summary", {})
        if num_summary:
            table_content = [["Column", "Mean", "Median", "Min", "Max", "Std Dev"]]
            for col, stats in num_summary.items():
                table_content.append([
                    col[:18],
                    str(stats.get("mean")),
                    str(stats.get("median")),
                    str(stats.get("min")),
                    str(stats.get("max")),
                    str(stats.get("std"))
                ])
            stats_table = Table(table_content, colWidths=[130, 80, 80, 80, 80, 90])
            stats_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#4338ca")),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,-1), 9),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
                ('PADDING', (0,0), (-1,-1), 6)
            ]))
            elements.append(stats_table)
            elements.append(Spacer(1, 15))

    
    if agent_sessions:
        elements.append(Paragraph("3. Agent Verified Insights & Q&A History", h2_style))
        for idx, s in enumerate(agent_sessions[:5], 1):
            q = s.get("question", "")
            ans = s.get("final_answer", "")
            elements.append(Paragraph(f"<b>Q{idx}: {q}</b>", ParagraphStyle('QStyle', parent=body_style, fontName='Helvetica-Bold', textColor=colors.HexColor("#1e1b4b"))))
            elements.append(Paragraph(f"<b>Answer:</b> {ans}", body_style))
            elements.append(Spacer(1, 8))

    doc.build(elements)
    return output_path
