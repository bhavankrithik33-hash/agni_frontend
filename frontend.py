"""
PROJECT AGNI: Public Cloud Deployment Version
Self-contained Industrial Dashboard (No Local Backend Required)
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime
import time

# ==================== PAGE CONFIG ====================
st.set_page_config(
    page_title="⚡ PROJECT AGNI | Industrial Command",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ==================== STYLING ====================
st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
    .stApp { background: #0a0e27; color: #e0e0e0; font-family: 'JetBrains Mono'; }
    h1, h2, h3 { color: #00ff65 !important; }
    .metric-box { 
        background: rgba(0, 255, 101, 0.05); 
        border: 1px solid rgba(0, 255, 101, 0.2);
        border-left: 4px solid #00ff65; 
        padding: 15px; 
        border-radius: 5px;
        margin-bottom: 10px;
    }
    .stTabs [data-baseweb="tab-list"] { background-color: transparent; }
    .stTabs [data-baseweb="tab"] { color: #888; }
    .stTabs [aria-selected="true"] { color: #00ff65 !important; border-color: #00ff65 !important; }
    </style>
""", unsafe_allow_html=True)

# ==================== DATA GENERATOR (INTERNAL BACKEND) ====================
def get_internal_data(panel_id: int):
    """Simulates the AGNI Logic (RPNDD + DWT) without an external API"""
    is_faulty = (panel_id == 5)
    
    # Physics parameters
    voltage = 15.12 + np.random.normal(0, 0.1) if is_faulty else 18.42 + np.random.normal(0, 0.05)
    irradiance = 285 + np.random.uniform(-5, 5) if is_faulty else 845 + np.random.uniform(-10, 10)
    
    # AGNI Logic: High variance in residuals = Shadowing
    rpndd = 0.2431 if is_faulty else 0.0372
    status = "SHADOWING" if is_faulty else "HEALTHY"
    
    return {
        "telemetry": {
            "v": voltage,
            "i": 4.2 if is_faulty else 5.6,
            "t": 51.5 if is_faulty else 44.2,
            "g": irradiance
        },
        "analysis": {
            "status": status,
            "conf": 0.89 if is_faulty else 0.98,
            "rpndd": rpndd,
            "weights": {"Irradiance": 0.88, "Temperature": 0.08, "Voltage": 0.04} if is_faulty else {"Irradiance": 0.33, "Temp": 0.33, "Volt": 0.34},
            "advice": "CRITICAL: Shadow detected via sub-cycle DWT. Clear obstructions SE sector." if is_faulty else "Operational efficiency nominal."
        }
    }

# ==================== HEADER & SIDEBAR ====================
st.sidebar.markdown("## 🛠️ SYSTEM KERNEL")
st.sidebar.info("Cloud Mode: ACTIVE")
st.sidebar.metric("V-THROUGHPUT", "10.4 kHz")
st.sidebar.metric("BUS STABILITY", "99.9%")

st.markdown("# ⚡ PROJECT AGNI - COMMAND CENTER")
st.caption("Industrial Solar Microgrid Monitoring System | Autonomous AI Diagnostics")

# ==================== GRID OVERVIEW ====================
st.divider()
c1, c2, c3, c4 = st.columns(4)
c1.markdown('<div class="metric-box"><b>HEALTHY UNITS</b><br>8 / 9</div>', unsafe_allow_html=True)
c2.markdown('<div class="metric-box"><b>ACTIVE FAULTS</b><br>1 (Unit 05)</div>', unsafe_allow_html=True)
c3.markdown('<div class="metric-box"><b>TOTAL YIELD</b><br>32.45 kW</div>', unsafe_allow_html=True)
c4.markdown('<div class="metric-box"><b>RPNDD AVG</b><br>0.041</div>', unsafe_allow_html=True)

# ==================== GRID MAP & PIE ====================
col_map, col_pie = st.columns([1.5, 1])

with col_map:
    st.markdown("### 🗺️ 3x3 ARRAY TOPOLOGY")
    fig = go.Figure()
    for i in range(9):
        p_id = i + 1
        row, col = i // 3, i % 3
        color = '#ff3b30' if p_id == 5 else '#00ff65'
        fig.add_trace(go.Scatter(
            x=[col], y=[2-row],
            mode='markers+text',
            marker=dict(size=45, color=color, line=dict(width=2, color='white')),
            text=[f"U{p_id:02d}"],
            textposition="middle center",
            hoverinfo='text'
        ))
    fig.update_layout(height=350, template='plotly_dark', paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)',
                      xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                      yaxis=dict(showgrid=False, zeroline=False, showticklabels=False))
    st.plotly_chart(fig, use_container_width=True)

with col_pie:
    st.markdown("### 📊 STATUS DISTRIBUTION")
    fig_pie = px.pie(values=[8, 1], names=['HEALTHY', 'SHADOWING'], 
                     color_discrete_sequence=['#00ff65', '#ff3b30'], hole=0.4)
    fig_pie.update_layout(height=350, template='plotly_dark', paper_bgcolor='rgba(0,0,0,0)', margin=dict(t=0,b=0,l=0,r=0))
    st.plotly_chart(fig_pie, use_container_width=True)

# ==================== DETAILED ANALYSIS ====================
st.divider()
selected_id = st.selectbox("🎯 SELECT UNIT FOR FORENSIC ANALYSIS", range(1, 10), format_func=lambda x: f"UNIT_{x:02d}")
data = get_internal_data(selected_id)

t1, t2, t3 = st.tabs(["📈 TELEMETRY", "🧠 XAI EXPLANATION", "🤖 AI ADVISOR"])

with t1:
    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Voltage", f"{data['telemetry']['v']:.2f} V")
    m2.metric("Current", f"{data['telemetry']['i']:.2f} A")
    m3.metric("Temp", f"{data['telemetry']['t']:.1f} °C")
    m4.metric("Irradiance", f"{data['telemetry']['g']:.0f} W/m²")
    
    # Signal pulse
    chart_data = pd.DataFrame(np.random.normal(data['telemetry']['v'], 0.1, size=(20, 1)), columns=['Voltage'])
    st.line_chart(chart_data, color="#00ff65")

with t2:
    st.markdown("#### Feature Attribution (SHAP Analysis)")
    weights = data['analysis']['weights']
    fig_xai = px.bar(x=list(weights.values()), y=list(weights.keys()), orientation='h',
                     color=list(weights.values()), color_continuous_scale='Viridis')
    fig_xai.update_layout(height=300, template='plotly_dark', xaxis_title="Impact Weight", yaxis_title="")
    st.plotly_chart(fig_xai, use_container_width=True)
    st.caption("XAI Note: Higher weight indicates the specific feature responsible for current yield delta.")

with t3:
    st.markdown(f"### Diagnostic Verdict: **{data['analysis']['status']}**")
    st.progress(data['analysis']['conf'])
    st.write(f"Confidence: {data['analysis']['conf']*100}%")
    st.info(data['analysis']['advice'])
    
    st.markdown("#### 🛠️ Recommended Action Plan")
    if data['analysis']['status'] == "SHADOWING":
        st.warning("1. Inspect SE sector for temporary obstructions.\n2. Verify sub-cycle DWT transients.\n3. Cleaning NOT required.")
    else:
        st.success("1. Maintain standard monitoring cycle.\n2. Surface condition nominal.")

st.markdown("<br><center><small>PROJECT AGNI | COIMBATORE NODE | © 2026</small></center>", unsafe_allow_html=True)
