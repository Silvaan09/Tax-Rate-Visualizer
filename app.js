const { createApp } = Vue

createApp({

  data() {

    return {

        taxData: window.taxData,

        sortedCantons: Object.keys(window.taxData).sort(),

        chart: null,

        chartMode: 'rate',

        scenarios: [],

        form: {

            scenarioName: "Zug",

            canton: "Zug",

            income: 120000,

            married: false,

            children: 0,

            religion: "Keine"

        },

        currentRate: 0,
        currentTaxes: 0

}

  },

  mounted() {

    this.chart = echarts.init(
      document.getElementById('chart')
    )

    this.calculatePreview()

    this.updateChart()

    window.addEventListener('resize', () => {
      this.chart.resize()
    })

  },

  methods: {

    calculateTaxRate() {

      let rate =
        taxData[this.form.canton]?.baseRate || 15

      // Income progression
      const incomeFactor =
        Math.log10(this.form.income / 50000) * 4

      rate += Math.max(incomeFactor, 0)

      // Married deduction
      if (this.form.married) {
        rate -= 1.2
      }

      // Children deduction
      rate -= this.form.children * 0.7

      // Church tax
      if (this.form.religion !== 'Keine') {
        rate += 0.8
      }

      return Math.max(rate, 2)

    },

    calculatePreview() {

      this.currentRate =
        this.calculateTaxRate()

      this.currentTaxes =
        Math.round(
          this.form.income *
          (this.currentRate / 100)
        )

    },

    calculateScenario() {

      this.calculatePreview()

      const scenarioName =
        this.form.scenarioName.trim() ||
        `Szenario ${this.scenarios.length + 1}`

      this.scenarios.push({

        id: Date.now(),

        name: scenarioName,

        canton: this.form.canton,

        income: this.form.income,

        married: this.form.married,

        children: this.form.children,

        religion: this.form.religion,

        rate: this.currentRate,

        taxes: this.currentTaxes,

        color: this.getScenarioColor()

        })

      this.updateChart()

    },

    getScenarioColor() {

        const colors = [

            '#1f2937',
            '#374151',
            '#4b5563',
            '#6b7280',
            '#8b5e3c',
            '#7c6754'

        ]

        return colors[
            this.scenarios.length % colors.length
        ]

    },

    removeScenario(index) {

      this.scenarios.splice(index, 1)

      this.updateChart()

    },

    updateChart() {

      this.chart.setOption({

        animationDuration: 600,

        tooltip: {
          trigger: 'axis'
        },

        grid: {
          left: 40,
          right: 20,
          top: 30,
          bottom: 60
        },

        xAxis: {

          type: 'category',

          data: this.scenarios.map(s => s.name),

          axisLabel: {
            rotate: 15
          }

        },

        yAxis: {

          type: 'value',

          axisLabel: {
            formatter: value => {

                return this.chartMode === 'rate'
                    ? value + '%'
                    : 'CHF ' + value.toLocaleString()

            }
          }

        },

        series: [

          {

            data: this.scenarios.map(s => ({

                value: this.chartMode === 'rate'
                    ? s.rate
                    : s.taxes,

                itemStyle: {
                    color: s.color
                }

            })),

            type: 'bar',

            barWidth: 50,

            itemStyle: {

              borderRadius: [10,10,0,0],

              color: '#1f2937'

            }

          }

        ]

      })

    }

  },

  watch: {

    'form.canton'(newCanton) {

        const currentName =
            this.form.scenarioName

        const knownCantons =
            this.sortedCantons

        // Only auto-update if user
        // has not customized manually

        const isDefaultName =
            knownCantons.some(canton =>
            currentName === `${canton} Szenario`
            )

        if (isDefaultName) {

            this.form.scenarioName =
            `${newCanton} Szenario`

        }

    },

    form: {

      deep: true,

      handler() {

        this.calculatePreview()

      }

    }

  }

}).mount('#app')