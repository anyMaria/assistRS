import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { MonthlyReportData } from "@/lib/report-data";
import { formatRate, formatNumber } from "@/lib/kpi";
import { formatGoalValue } from "@/lib/goals";
import { goalMetricLabel, platformLabel, formatLabel, formatMinutes, formatMoney } from "@/lib/constants";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 11, color: "#1C1917" },
  coverBar: { height: 8, width: "100%" },
  brandName: { fontFamily: "Times-Roman", fontSize: 32, marginTop: 50, marginBottom: 8 },
  month: { fontSize: 14, color: "#57534E" },
  sectionTitle: { fontFamily: "Times-Roman", fontSize: 18, marginTop: 24, marginBottom: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  kpiBox: { border: "1pt solid #1C1917", padding: 10, width: "48%", marginBottom: 8 },
  kpiLabel: { fontSize: 9, color: "#78716C" },
  kpiValue: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  delta: { fontSize: 9, marginTop: 2 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 9,
    color: "#A8A29E",
    textAlign: "center",
  },
});

export function RapportPDF({ data }: { data: MonthlyReportData }) {
  const deltaReach = data.previousAgg.reach
    ? ((data.currentAgg.reach - data.previousAgg.reach) / data.previousAgg.reach) * 100
    : null;

  return (
    <Document title={`Rapport ${data.account.name} — ${data.monthLabel}`}>
      <Page size="A4" style={styles.page}>
        <View style={[styles.coverBar, { backgroundColor: data.account.color }]} />
        <Text style={styles.brandName}>{data.account.name}</Text>
        <Text style={styles.month}>Rapport du mois — {data.monthLabel}</Text>

        <Text style={styles.sectionTitle}>Indicateurs clés</Text>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>PORTÉE CUMULÉE</Text>
            <Text style={styles.kpiValue}>{formatNumber(data.currentAgg.reach)}</Text>
            {deltaReach !== null && (
              <Text style={[styles.delta, { color: deltaReach >= 0 ? "#3D7C47" : "#7A1512" }]}>
                {deltaReach >= 0 ? "+" : ""}
                {deltaReach.toFixed(0)} % vs mois précédent
              </Text>
            )}
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>TAUX D&apos;ENGAGEMENT</Text>
            <Text style={styles.kpiValue}>{formatRate(data.currentAgg.engagementRate)}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>ABONNÉS GAGNÉS</Text>
            <Text style={styles.kpiValue}>{formatNumber(data.currentAgg.followersGained)}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>CONVERSIONS</Text>
            <Text style={styles.kpiValue}>{formatNumber(data.currentAgg.conversions)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Top publications du mois</Text>
        {data.topPublications.length === 0 ? (
          <Text>Aucune publication avec des stats ce mois-ci.</Text>
        ) : (
          data.topPublications.map((p, i) => (
            <View key={i} style={styles.row}>
              <Text>
                {i + 1}. {p.title} ({platformLabel(p.platform)} · {formatLabel(p.format)})
              </Text>
              <Text>{formatRate(p.rate)}</Text>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Objectifs</Text>
        {data.goalsProgress.length === 0 ? (
          <Text>Aucun objectif défini pour cette période.</Text>
        ) : (
          data.goalsProgress.map((g, i) => (
            <View key={i} style={styles.row}>
              <Text>{goalMetricLabel(g.metric)}</Text>
              <Text>
                {formatGoalValue(g.metric, g.current)} / {formatGoalValue(g.metric, g.target)} (
                {Math.round(g.ratio * 100)} %)
              </Text>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Temps passé</Text>
        <Text>
          {formatMinutes(data.minutes)}
          {data.valuedCents !== null ? ` — valorisé ${formatMoney(data.valuedCents)}` : ""}
        </Text>

        <Text style={styles.footer}>Généré avec Assist RS</Text>
      </Page>
    </Document>
  );
}
