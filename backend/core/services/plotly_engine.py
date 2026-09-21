class TanacakraPlotlyEngine:
    """
    Generator skema JSON Plotly.js untuk visualisasi data interaktif di Vue Frontend.
    """
    @staticmethod
    def generate_soil_radar_chart(parameters: dict) -> dict:
        """
        Menghasilkan skema Radar Chart (Spider Plot) untuk keseimbangan nutrisi tanah.
        """
        ph = float(parameters.get('pH', parameters.get('soil_ph', 6.5)))
        kelembapan = float(parameters.get('kelembapan', parameters.get('humidity_percent', 60)))
        n = float(parameters.get('nitrogen', parameters.get('n', 100)))
        p = float(parameters.get('fosfor', parameters.get('p', 35)))
        k = float(parameters.get('kalium', parameters.get('k', 130)))

        # Normalisasi ke skala 0-100% dari target optimal (pH ideal = 6.5)
        ph_dev = abs(ph - 6.5)
        norm_ph = max(0.0, min(100.0, 100.0 - ph_dev * 25.0))
        norm_kelembapan = min(100.0, (kelembapan / 80.0) * 100.0)
        norm_n = min(100.0, (n / 140.0) * 100.0)
        norm_p = min(100.0, (p / 50.0) * 100.0)
        norm_k = min(100.0, (k / 160.0) * 100.0)

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
        ph_list = [
            float(rec.get('input_parameters', {}).get('pH', rec.get('input_parameters', {}).get('soil_ph', 6.0)))
            for rec in history_records
        ] or [6.2, 6.1, 5.8, 6.4, 6.5]
        moisture_list = [
            float(rec.get('input_parameters', {}).get('kelembapan', rec.get('input_parameters', {}).get('humidity_percent', 65)))
            for rec in history_records
        ] or [65, 60, 58, 70, 72]

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

    @staticmethod
    def generate_price_trend_chart(trends: list, volume_trends: list = None) -> dict:
        """
        Menghasilkan Line & Bar Chart interaktif berbasis Plotly.js untuk Tren Harga & Volume Panen.
        Baris harga digenerated dinamis dari seluruh komoditas yang ada di database.
        """
        months = [t.get('month', '') for t in trends]
        commodity_keys = [k for k in (trends[0].keys() if trends else []) if k != 'month']

        colors = {
            'Cabai Merah': '#C84C32',
            'Salak Pondoh': '#4A5B3A',
            'Bawang Merah': '#8B3A62',
            'Padi': '#D99B26',
            'Jagung': '#E07A5F',
            'Kacang Tanah': '#7E5A3C',
            'Tomat': '#E63946',
        }
        palette = ['#C84C32', '#4A5B3A', '#8B3A62', '#D99B26', '#E07A5F', '#7E5A3C', '#E63946', '#2F4A2C']

        data = []
        for idx, key in enumerate(commodity_keys):
            series = [t.get(key) for t in trends]
            color = colors.get(key, palette[idx % len(palette)])
            data.append({
                "x": months,
                "y": series,
                "type": "scatter",
                "mode": "lines+markers",
                "name": f"{key} (Rp/kg)",
                "line": {"color": color, "width": 2.5, "shape": "spline"},
                "marker": {"size": 6, "color": color},
                "hovertemplate": f"<b>%{{x}}</b><br>{key}: Rp %{{y:,.0f}}/kg<extra></extra>"
            })

        volume_data = volume_trends or []
        volume_months = [v.get('month', '') for v in volume_data]
        volume_vals = [v.get('volume_ton', 0) for v in volume_data]
        if not volume_vals:
            volume_months = months
            volume_vals = [350 for _ in months]

        data.append({
            "x": volume_months,
            "y": volume_vals,
            "type": "bar",
            "name": "Volume Panen (Ton)",
            "yaxis": "y2",
            "opacity": 0.35,
            "marker": {"color": "#D97706"},
            "hovertemplate": "<b>%{x}</b><br>Volume Panen: %{y:.1f} Ton<extra></extra>"
        })

        return {
            "data": data,
            "layout": {
                "title": {
                    "text": "<b>Fluktuasi Harga Pasar & Volume Panen Cangkringan</b>",
                    "font": {"size": 15, "color": "#2C2622", "family": "Plus Jakarta Sans, sans-serif"}
                },
                "margin": {"l": 60, "r": 60, "t": 50, "b": 45},
                "xaxis": {
                    "title": "Bulan Transaksi",
                    "showgrid": True,
                    "gridcolor": "#EFEAE0",
                    "tickfont": {"size": 11, "color": "#5C4A32"}
                },
                "yaxis": {
                    "title": "Harga Pasar (Rp / kg)",
                    "showgrid": True,
                    "gridcolor": "#EFEAE0",
                    "tickprefix": "Rp ",
                    "tickfont": {"size": 11, "color": "#5C4A32"}
                },
                "yaxis2": {
                    "title": "Volume Panen (Ton)",
                    "overlaying": "y",
                    "side": "right",
                    "showgrid": False,
                    "ticksuffix": " Ton",
                    "tickfont": {"size": 11, "color": "#D97706"}
                },
                "legend": {
                    "orientation": "h",
                    "x": 0,
                    "y": 1.3,
                    "font": {"size": 10, "color": "#2C2622"}
                },
                "paper_bgcolor": "transparent",
                "plot_bgcolor": "transparent",
                "hovermode": "x unified",
                "font": {"color": "#2C2622", "family": "Plus Jakarta Sans, sans-serif"}
            }
        }

plotly_engine = TanacakraPlotlyEngine()
