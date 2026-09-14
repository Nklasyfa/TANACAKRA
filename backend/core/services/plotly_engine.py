class TanacakraPlotlyEngine:
    """
    Generator skema JSON Plotly.js untuk visualisasi data interaktif di Vue Frontend.
    """
    @staticmethod
    def generate_soil_radar_chart(parameters: dict) -> dict:
        """
        Menghasilkan skema Radar Chart (Spider Plot) untuk keseimbangan nutrisi tanah.
        """
        ph = float(parameters.get('pH', 6.5))
        kelembapan = float(parameters.get('kelembapan', 60))
        n = float(parameters.get('nitrogen', 100))
        p = float(parameters.get('fosfor', 35))
        k = float(parameters.get('kalium', 130))

        # Normalisasi ke skala 0-100% dari target optimal
        norm_ph = min(100, (ph / 7.0) * 100)
        norm_kelembapan = min(100, (kelembapan / 80.0) * 100)
        norm_n = min(100, (n / 140.0) * 100)
        norm_p = min(100, (p / 50.0) * 100)
        norm_k = min(100, (k / 160.0) * 100)

        categories = ['pH Tanah', 'Kelembapan', 'Nitrogen (N)', 'Fosfor (P)', 'Kalium (K)']
        values = [norm_ph, norm_kelembapan, norm_n, norm_p, norm_k]
        optimal_values = [100, 100, 100, 100, 100]

        return {
            "data": [
                {
                    "type": "scatterpolar",
                    "r": values + [values[0]],
                    "theta": categories + [categories[0]],
                    "fill": "toself",
                    "name": "Kondisi Lahan Saat Ini",
                    "line": {"color": "#16a34a"} # Green
                },
                {
                    "type": "scatterpolar",
                    "r": optimal_values + [optimal_values[0]],
                    "theta": categories + [categories[0]],
                    "fill": "none",
                    "name": "Target Optimal",
                    "line": {"color": "#9ca3af", "dash": "dash"}
                }
            ],
            "layout": {
                "title": "Keseimbangan Nutrisi Lahan Pertanian Cangkringan",
                "polar": {
                    "radialaxis": {
                        "visible": True,
                        "range": [0, 100]
                    }
                },
                "showlegend": True,
                "paper_bgcolor": "transparent",
                "plot_bgcolor": "transparent",
                "font": {"color": "#374151", "family": "Plus Jakarta Sans, sans-serif"}
            }
        }

    @staticmethod
    def generate_history_trend_chart(history_records: list) -> dict:
        """
        Menghasilkan Line Chart historis perubahan pH dan Kelembapan.
        """
        dates = [rec.get('created_at', '')[:10] for rec in history_records] or ['Hari 1', 'Hari 2', 'Hari 3', 'Hari 4', 'Hari 5']
        ph_list = [rec.get('input_parameters', {}).get('pH', 6.0) for rec in history_records] or [6.2, 6.1, 5.8, 6.4, 6.5]
        moisture_list = [rec.get('input_parameters', {}).get('kelembapan', 65) for rec in history_records] or [65, 60, 58, 70, 72]

        return {
            "data": [
                {
                    "x": dates,
                    "y": ph_list,
                    "type": "scatter",
                    "mode": "lines+markers",
                    "name": "pH Tanah",
                    "line": {"color": "#059669", "width": 3}
                },
                {
                    "x": dates,
                    "y": moisture_list,
                    "type": "scatter",
                    "mode": "lines+markers",
                    "name": "Kelembapan (%)",
                    "yaxis": "y2",
                    "line": {"color": "#2563eb", "width": 3}
                }
            ],
            "layout": {
                "title": "Tren Parameter Lahan (14 Hari Terakhir)",
                "xaxis": {"title": "Tanggal / Waktu"},
                "yaxis": {"title": "pH Tanah", "range": [0, 14]},
                "yaxis2": {
                    "title": "Kelembapan (%)",
                    "overlaying": "y",
                    "side": "right",
                    "range": [0, 100]
                },
                "paper_bgcolor": "transparent",
                "plot_bgcolor": "transparent",
                "font": {"color": "#374151"}
            }
        }

plotly_engine = TanacakraPlotlyEngine()
