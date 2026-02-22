// ============================================================
// EREM MODULE INDEX
// Central export point for the Epistemic Risk Engine for Medical Education
// ============================================================

// Core Types
export * from './epistemicTypes'

// Risk Fusion Pipeline
export * from './riskFusion'

// Trajectory Analysis
export * from './trajectoryAnalyzer'

// SHAP Explainability
export * from './shapExplainer'

// Intervention Engine
export * from './interventionEngine'

// React Components
export { RiskGauge, RiskDimensionBar } from './components/RiskGauge'
export { SHAPWaterfallChart, SHAPBarChart } from './components/SHAPCharts'
export { TrajectoryChart, DimensionTrendChart } from './components/TrajectoryCharts'
export { ProvenancePanel, DataSourceSummary } from './components/ProvenancePanel'
