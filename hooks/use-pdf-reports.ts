"use client"

import { useCallback } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { useAuth } from "@/contexts/auth-context"

interface AutoTableOptions {
  startY?: number
  head?: any[][]
  body?: any[][]
  theme?: string
  headStyles?: any
  margin?: any
  columnStyles?: any
}

export const usePdfReports = () => {
  const { user } = useAuth()

  const generateHeader = useCallback(
    (doc: jsPDF, title: string) => {
      // Company header
      doc.setFontSize(20)
      doc.setFont("helvetica", "bold")
      doc.text(user?.company || "Controle de Frotas", 20, 25)

      doc.setFontSize(14)
      doc.setFont("helvetica", "normal")
      doc.text(title, 20, 35)

      // Date
      doc.setFontSize(10)
      doc.text(
        `Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
        20,
        45,
      )

      // Line separator
      doc.setLineWidth(0.5)
      doc.line(20, 50, 190, 50)

      return 60 // Return Y position for content
    },
    [user],
  )

  const generateDashboardReport = useCallback(
    (data: {
      stats: any
      transactions: any[]
      trips: any[]
    }) => {
      const doc = new jsPDF()
      let yPos = generateHeader(doc, "Relatório do Dashboard")

      // Statistics section
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Estatísticas Gerais", 20, yPos)
      yPos += 15

      // Calculate real stats from actual data
      const totalRevenue = data.transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + (t.amount || 0), 0)

      const totalExpenses = data.transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + (t.amount || 0), 0)

      const netProfit = totalRevenue - totalExpenses
      const activeTrips = data.trips.filter((t) => t.status === "in_progress").length
      const completedTrips = data.trips.filter((t) => t.status === "completed").length

      const statsData = [
        ["Total de Receitas", `R$ ${totalRevenue.toFixed(2)}`],
        ["Total de Despesas", `R$ ${totalExpenses.toFixed(2)}`],
        ["Lucro Líquido", `R$ ${netProfit.toFixed(2)}`],
        ["Viagens Ativas", activeTrips.toString()],
        ["Viagens Finalizadas", completedTrips.toString()],
      ]

      autoTable(doc, {
        startY: yPos,
        head: [["Métrica", "Valor"]],
        body: statsData,
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 20, right: 20 },
      })

      yPos = (doc as any).lastAutoTable.finalY + 20

      // Recent transactions
      if (data.transactions.length > 0) {
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("Transações Recentes", 20, yPos)
        yPos += 10

        const transactionData = data.transactions
          .slice(0, 10)
          .map((t) => [
            new Date(t.date).toLocaleDateString("pt-BR"),
            t.description,
            t.type === "income" ? "Receita" : "Despesa",
            `R$ ${t.amount.toFixed(2)}`,
          ])

        autoTable(doc, {
          startY: yPos,
          head: [["Data", "Descrição", "Tipo", "Valor"]],
          body: transactionData,
          theme: "grid",
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: 20, right: 20 },
        })
      }

      doc.save("relatorio-dashboard.pdf")
    },
    [generateHeader],
  )

  const generateFinanceReport = useCallback(
    (transactions: any[]) => {
      const doc = new jsPDF()
      let yPos = generateHeader(doc, "Relatório Financeiro")

      // Summary
      const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
      const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
      const netProfit = totalIncome - totalExpenses

      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Resumo Financeiro", 20, yPos)
      yPos += 15

      const summaryData = [
        ["Total de Receitas", `R$ ${totalIncome.toFixed(2)}`],
        ["Total de Despesas", `R$ ${totalExpenses.toFixed(2)}`],
        ["Lucro Líquido", `R$ ${netProfit.toFixed(2)}`],
      ]

      autoTable(doc, {
        startY: yPos,
        head: [["Categoria", "Valor"]],
        body: summaryData,
        theme: "grid",
        headStyles: { fillColor: [34, 197, 94] },
        margin: { left: 20, right: 20 },
      })

      yPos = (doc as any).lastAutoTable.finalY + 20

      // Detailed transactions
      if (transactions.length > 0) {
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("Detalhamento de Transações", 20, yPos)
        yPos += 10

        const transactionData = transactions.map((t) => [
          new Date(t.date).toLocaleDateString("pt-BR"),
          t.description,
          t.category || "-",
          t.type === "income" ? "Receita" : "Despesa",
          `R$ ${t.amount.toFixed(2)}`,
          t.tripId ? "Sim" : "Não",
        ])

        autoTable(doc, {
          startY: yPos,
          head: [["Data", "Descrição", "Categoria", "Tipo", "Valor", "Vinculada à Viagem"]],
          body: transactionData,
          theme: "grid",
          headStyles: { fillColor: [34, 197, 94] },
          margin: { left: 20, right: 20 },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 40 },
            2: { cellWidth: 25 },
            3: { cellWidth: 20 },
            4: { cellWidth: 25 },
            5: { cellWidth: 20 },
          },
        })
      }

      doc.save("relatorio-financeiro.pdf")
    },
    [generateHeader],
  )

  const generateTripsReport = useCallback(
    (trips: any[]) => {
      const doc = new jsPDF()
      let yPos = generateHeader(doc, "Relatório de Viagens")

      // Summary
      const activeTrips = trips.filter((t) => t.status === "in_progress").length
      const completedTrips = trips.filter((t) => t.status === "completed").length
      const totalKm = trips.reduce((sum, t) => sum + (t.kmTraveled || 0), 0)

      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Resumo de Viagens", 20, yPos)
      yPos += 15

      const summaryData = [
        ["Viagens Ativas", activeTrips.toString()],
        ["Viagens Finalizadas", completedTrips.toString()],
        ["Total de Viagens", trips.length.toString()],
        ["Quilometragem Total", `${totalKm.toLocaleString("pt-BR")} km`],
      ]

      autoTable(doc, {
        startY: yPos,
        head: [["Métrica", "Valor"]],
        body: summaryData,
        theme: "grid",
        headStyles: { fillColor: [168, 85, 247] },
        margin: { left: 20, right: 20 },
      })

      yPos = (doc as any).lastAutoTable.finalY + 20

      // Detailed trips
      if (trips.length > 0) {
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("Detalhamento de Viagens", 20, yPos)
        yPos += 10

        const tripData = trips.map((t) => [
          t.truckPlate,
          t.driverName,
          t.startLocation,
          t.endLocation || "-",
          new Date(t.startDate).toLocaleDateString("pt-BR"),
          t.endDate ? new Date(t.endDate).toLocaleDateString("pt-BR") : "-",
          t.status === "in_progress" ? "Em Andamento" : "Finalizada",
          `${t.kmTraveled || 0} km`,
          t.fuelLiters ? `${t.fuelLiters} L` : "-",
          t.fuelConsumption ? `${t.fuelConsumption.toFixed(3)} L/km` : "-",
        ])

        autoTable(doc, {
          startY: yPos,
          head: [["Placa", "Motorista", "Origem", "Destino", "Início", "Fim", "Status", "KM", "Combustível", "Consumo"]],
          body: tripData,
          theme: "grid",
          headStyles: { fillColor: [168, 85, 247] },
          margin: { left: 20, right: 20 },
          columnStyles: {
            0: { cellWidth: 18 },
            1: { cellWidth: 22 },
            2: { cellWidth: 22 },
            3: { cellWidth: 22 },
            4: { cellWidth: 18 },
            5: { cellWidth: 18 },
            6: { cellWidth: 18 },
            7: { cellWidth: 12 },
            8: { cellWidth: 15 },
            9: { cellWidth: 15 },
          },
        })
      }

      doc.save("relatorio-viagens.pdf")
    },
    [generateHeader],
  )

  const generateTrucksReport = useCallback(
    (trucks: any[]) => {
      const doc = new jsPDF()
      let yPos = generateHeader(doc, "Relatório da Frota")

      // Summary
      const activeTrucks = trucks.filter((t) => t.status === "active").length
      const maintenanceTrucks = trucks.filter((t) => t.status === "maintenance").length
      const inactiveTrucks = trucks.filter((t) => t.status === "inactive").length

      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Resumo da Frota", 20, yPos)
      yPos += 15

      const summaryData = [
        ["Caminhões Ativos", activeTrucks.toString()],
        ["Em Manutenção", maintenanceTrucks.toString()],
        ["Inativos", inactiveTrucks.toString()],
        ["Total da Frota", trucks.length.toString()],
      ]

      autoTable(doc, {
        startY: yPos,
        head: [["Status", "Quantidade"]],
        body: summaryData,
        theme: "grid",
        headStyles: { fillColor: [245, 158, 11] },
        margin: { left: 20, right: 20 },
      })

      yPos = (doc as any).lastAutoTable.finalY + 20

      // Detailed trucks
      if (trucks.length > 0) {
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("Detalhamento da Frota", 20, yPos)
        yPos += 10

        const truckData = trucks.map((t) => [
          t.plate,
          t.brand,
          t.model,
          t.year.toString(),
          `${t.mileage.toLocaleString("pt-BR")} km`,
          t.status === "active" ? "Ativo" : t.status === "maintenance" ? "Manutenção" : "Inativo",
        ])

        autoTable(doc, {
          startY: yPos,
          head: [["Placa", "Marca", "Modelo", "Ano", "Quilometragem", "Status"]],
          body: truckData,
          theme: "grid",
          headStyles: { fillColor: [245, 158, 11] },
          margin: { left: 20, right: 20 },
        })
      }

      doc.save("relatorio-frota.pdf")
    },
    [generateHeader],
  )

  const generateDriversReport = useCallback(
    (drivers: any[]) => {
      const doc = new jsPDF()
      let yPos = generateHeader(doc, "Relatório de Motoristas")

      // Summary
      const activeDrivers = drivers.filter((d) => d.status === "active").length
      const inactiveDrivers = drivers.filter((d) => d.status === "inactive").length
      const expiredDrivers = drivers.filter((d) => d.status === "expired").length

      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Resumo de Motoristas", 20, yPos)
      yPos += 15

      const summaryData = [
        ["Motoristas Ativos", activeDrivers.toString()],
        ["Inativos", inactiveDrivers.toString()],
        ["Licença Vencida", expiredDrivers.toString()],
        ["Total de Motoristas", drivers.length.toString()],
      ]

      autoTable(doc, {
        startY: yPos,
        head: [["Status", "Quantidade"]],
        body: summaryData,
        theme: "grid",
        headStyles: { fillColor: [239, 68, 68] },
        margin: { left: 20, right: 20 },
      })

      yPos = (doc as any).lastAutoTable.finalY + 20

      // Detailed drivers
      if (drivers.length > 0) {
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("Detalhamento de Motoristas", 20, yPos)
        yPos += 10

        const driverData = drivers.map((d) => [
          d.name,
          d.cpf,
          d.phone,
          d.licenseNumber,
          new Date(d.licenseExpiry).toLocaleDateString("pt-BR"),
          d.status === "active" ? "Ativo" : d.status === "inactive" ? "Inativo" : "Licença Vencida",
        ])

        autoTable(doc, {
          startY: yPos,
          head: [["Nome", "CPF", "Telefone", "CNH", "Vencimento CNH", "Status"]],
          body: driverData,
          theme: "grid",
          headStyles: { fillColor: [239, 68, 68] },
          margin: { left: 20, right: 20 },
          columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 25 },
            2: { cellWidth: 25 },
            3: { cellWidth: 25 },
            4: { cellWidth: 25 },
            5: { cellWidth: 25 },
          },
        })
      }

      doc.save("relatorio-motoristas.pdf")
    },
    [generateHeader],
  )

  const generateMachineryReport = useCallback(
    (machinery: any[]) => {
      const doc = new jsPDF()
      let yPos = generateHeader(doc, "Relatório de Máquinas Pesadas")

      // Summary
      const activeMachinery = machinery.filter((m) => m.status === "active").length
      const maintenanceMachinery = machinery.filter((m) => m.status === "maintenance").length
      const inactiveMachinery = machinery.filter((m) => m.status === "inactive").length
      const totalHours = machinery.reduce((sum, m) => sum + (m.hours || 0), 0)

      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Resumo de Máquinas", 20, yPos)
      yPos += 15

      const summaryData = [
        ["Máquinas Ativas", activeMachinery.toString()],
        ["Em Manutenção", maintenanceMachinery.toString()],
        ["Inativas", inactiveMachinery.toString()],
        ["Total de Máquinas", machinery.length.toString()],
        ["Total de Horas", `${totalHours.toLocaleString("pt-BR")} h`],
      ]

      autoTable(doc, {
        startY: yPos,
        head: [["Métrica", "Valor"]],
        body: summaryData,
        theme: "grid",
        headStyles: { fillColor: [156, 163, 175] },
        margin: { left: 20, right: 20 },
      })

      yPos = (doc as any).lastAutoTable.finalY + 20

      // Detailed machinery
      if (machinery.length > 0) {
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("Detalhamento de Máquinas", 20, yPos)
        yPos += 10

        const typeLabels = {
          tractor: "Trator",
          excavator: "Retroescavadeira",
          loader: "Carregadeira",
          bulldozer: "Bulldozer",
          crane: "Guindaste",
          other: "Outros",
        }

        const machineryData = machinery.map((m) => [
          m.serialNumber,
          typeLabels[m.type as keyof typeof typeLabels] || m.type,
          m.brand,
          m.model,
          m.year.toString(),
          `${m.hours.toLocaleString("pt-BR")} h`,
          m.status === "active" ? "Ativa" : m.status === "maintenance" ? "Manutenção" : "Inativa",
        ])

        autoTable(doc, {
          startY: yPos,
          head: [["Série", "Tipo", "Marca", "Modelo", "Ano", "Horímetro", "Status"]],
          body: machineryData,
          theme: "grid",
          headStyles: { fillColor: [156, 163, 175] },
          margin: { left: 20, right: 20 },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 30 },
            2: { cellWidth: 25 },
            3: { cellWidth: 25 },
            4: { cellWidth: 15 },
            5: { cellWidth: 25 },
            6: { cellWidth: 25 },
          },
        })
      }

      doc.save("relatorio-maquinas.pdf")
    },
    [generateHeader],
  )

  const generateRentalsReport = useCallback(
    (rentals: any[]) => {
      const doc = new jsPDF()
      let yPos = generateHeader(doc, "Relatório de Locações")

      // Summary
      const activeRentals = rentals.filter((r) => r.status === "in_progress").length
      const completedRentals = rentals.filter((r) => r.status === "completed").length
      const totalRevenue = rentals
        .filter((r) => r.status === "completed")
        .reduce((sum, r) => {
          const totalHours = (r.finalHours || 0) - r.initialHours
          return sum + (totalHours * r.hourlyRate)
        }, 0)
      const totalHours = rentals
        .filter((r) => r.status === "completed")
        .reduce((sum, r) => sum + ((r.finalHours || 0) - r.initialHours), 0)

      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Resumo de Locações", 20, yPos)
      yPos += 15

      const summaryData = [
        ["Locações Ativas", activeRentals.toString()],
        ["Locações Finalizadas", completedRentals.toString()],
        ["Total de Locações", rentals.length.toString()],
        ["Total de Horas", `${totalHours.toLocaleString("pt-BR")} h`],
        ["Receita Total", `R$ ${totalRevenue.toFixed(2)}`],
      ]

      autoTable(doc, {
        startY: yPos,
        head: [["Métrica", "Valor"]],
        body: summaryData,
        theme: "grid",
        headStyles: { fillColor: [99, 102, 241] },
        margin: { left: 20, right: 20 },
      })

      yPos = (doc as any).lastAutoTable.finalY + 20

      // Detailed rentals
      if (rentals.length > 0) {
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("Detalhamento de Locações", 20, yPos)
        yPos += 10

        const rentalData = rentals.map((r) => {
          const totalHours = r.finalHours ? r.finalHours - r.initialHours : 0
          const totalValue = totalHours * r.hourlyRate
          
          return [
            r.machinerySerial,
            r.driverName,
            r.startLocation,
            r.endLocation || "-",
            new Date(r.date).toLocaleDateString("pt-BR"),
            r.endDate ? new Date(r.endDate).toLocaleDateString("pt-BR") : "-",
            r.status === "in_progress" ? "Em Andamento" : "Finalizada",
            `${totalHours.toFixed(1)} h`,
            `R$ ${r.hourlyRate.toFixed(2)}`,
            `R$ ${totalValue.toFixed(2)}`,
          ]
        })

        autoTable(doc, {
          startY: yPos,
          head: [["Máquina", "Motorista", "Origem", "Destino", "Início", "Fim", "Status", "Horas", "Valor/h", "Total"]],
          body: rentalData,
          theme: "grid",
          headStyles: { fillColor: [99, 102, 241] },
          margin: { left: 20, right: 20 },
          columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 20 },
            2: { cellWidth: 20 },
            3: { cellWidth: 20 },
            4: { cellWidth: 18 },
            5: { cellWidth: 18 },
            6: { cellWidth: 18 },
            7: { cellWidth: 15 },
            8: { cellWidth: 18 },
            9: { cellWidth: 18 },
          },
        })
      }

      doc.save("relatorio-locacoes.pdf")
    },
    [generateHeader],
  )
  const generateSingleTripReport = useCallback(
    (trip: any, transactions: any[] = []) => {
      const doc = new jsPDF()
      const tripId = trip.id?.slice(-6) || "—"
      let yPos: number = generateHeader(doc, `Relatório de Viagem #${tripId}`)

      const formatBRL = (value: number) =>
        value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

      const kmTraveled = trip.endKm && trip.startKm ? trip.endKm - trip.startKm : 0
      const fuelConsumed =
        trip.fuelConsumption && kmTraveled > 0 ? kmTraveled / trip.fuelConsumption : 0

      // Status
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Informações Gerais", 20, yPos)
      yPos += 10

      const status = trip.status === "in_progress" ? "Em Andamento" : "Finalizada"

      const generalData = [
        ["Status", status],
        ["Caminhão (Placa)", trip.truckPlate || "—"],
        ["Motorista", trip.driverName || "—"],
        ["Origem", trip.startLocation || "—"],
        ["Destino", trip.endLocation || "—"],
        ["KM Inicial", trip.startKm ? `${trip.startKm.toLocaleString("pt-BR")} km` : "—"],
        ["KM Final", trip.endKm ? `${trip.endKm.toLocaleString("pt-BR")} km` : "—"],
        ["KM Percorridos", kmTraveled > 0 ? `${kmTraveled.toLocaleString("pt-BR")} km` : "—"],
        [
          "Início",
          trip.startDate
            ? `${new Date(trip.startDate).toLocaleDateString("pt-BR")} ${trip.startTime || ""}`
            : "—",
        ],
        [
          "Fim",
          trip.endDate
            ? `${new Date(trip.endDate).toLocaleDateString("pt-BR")} ${trip.endTime || ""}`
            : "—",
        ],
      ]

      if (trip.cargoDescription) {
        generalData.push(["Descrição da Carga", trip.cargoDescription])
      }

      autoTable(doc, {
        startY: yPos,
        head: [["Campo", "Valor"]],
        body: generalData,
        theme: "grid",
        headStyles: { fillColor: [168, 85, 247] },
        margin: { left: 20, right: 20 },
        columnStyles: { 0: { cellWidth: 60, fontStyle: "bold" } },
      })

      yPos = (doc as any).lastAutoTable.finalY + 15

      // Fuel section
      if (trip.status === "completed") {
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("Dados de Combustível", 20, yPos)
        yPos += 10

        const remainingFuel =
          trip.refuelingLiters && fuelConsumed > 0
            ? Math.max(0, trip.refuelingLiters - fuelConsumed)
            : 0

        const fuelData: string[][] = []
        if (trip.fuelConsumption) {
          fuelData.push(["Consumo Médio", `${trip.fuelConsumption.toFixed(2)} km/L`])
        }
        if (trip.refuelingLiters) {
          fuelData.push(["Abastecimento Total", `${trip.refuelingLiters.toFixed(2)} L`])
        }
        if (fuelConsumed > 0) {
          fuelData.push(["Combustível Consumido", `${fuelConsumed.toFixed(2)} L`])
        }
        if (remainingFuel > 0) {
          fuelData.push(["Combustível Restante", `${remainingFuel.toFixed(2)} L`])
        }

        if (fuelData.length > 0) {
          autoTable(doc, {
            startY: yPos,
            head: [["Métrica", "Valor"]],
            body: fuelData,
            theme: "grid",
            headStyles: { fillColor: [168, 85, 247] },
            margin: { left: 20, right: 20 },
            columnStyles: { 0: { cellWidth: 60, fontStyle: "bold" } },
          })
          yPos = (doc as any).lastAutoTable.finalY + 15
        }
      }

      // Fluxo Financeiro
      const tripTx = (transactions || []).filter((t) => t.tripId === trip.id)
      const tripExpenses = tripTx.filter((t) => t.type === "despesa")
      const tripIncomes = tripTx.filter((t) => t.type === "receita")
      const totalExpenses = tripExpenses.reduce((sum, t) => sum + (t.amount || 0), 0)
      const totalIncomes = tripIncomes.reduce((sum, t) => sum + (t.amount || 0), 0)
      const freight = trip.freightValue || 0
      const totalRevenues = freight + totalIncomes
      const profit = totalRevenues - totalExpenses

      const hasFinancialData = freight > 0 || tripExpenses.length > 0 || tripIncomes.length > 0

      if (hasFinancialData) {
        if (yPos > 240) {
          doc.addPage()
          yPos = 20
        }

        doc.setTextColor(0, 0, 0)
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("Fluxo Financeiro", 20, yPos)
        yPos += 10

        // Receitas
        const incomeRows: string[][] = []
        if (freight > 0) {
          incomeRows.push(["Frete", "Valor do frete", formatBRL(freight)])
        }
        tripIncomes.forEach((t) => {
          incomeRows.push([t.category || "—", t.description || "—", formatBRL(t.amount || 0)])
        })

        if (incomeRows.length > 0) {
          doc.setFontSize(11)
          doc.setFont("helvetica", "bold")
          doc.setTextColor(34, 197, 94)
          doc.text("Receitas", 20, yPos)
          yPos += 6
          doc.setTextColor(0, 0, 0)

          autoTable(doc, {
            startY: yPos,
            head: [["Categoria", "Descrição", "Valor"]],
            body: incomeRows,
            theme: "grid",
            headStyles: { fillColor: [34, 197, 94] },
            margin: { left: 20, right: 20 },
            columnStyles: {
              0: { cellWidth: 45, fontStyle: "bold" },
              2: { cellWidth: 35, halign: "right" },
            },
            foot: [["", "Total Receitas", formatBRL(totalRevenues)]],
            footStyles: { fillColor: [220, 252, 231], textColor: [22, 101, 52], fontStyle: "bold" },
          })
          yPos = (doc as any).lastAutoTable.finalY + 10
        }

        // Despesas
        if (tripExpenses.length > 0) {
          if (yPos > 250) {
            doc.addPage()
            yPos = 20
          }
          doc.setFontSize(11)
          doc.setFont("helvetica", "bold")
          doc.setTextColor(239, 68, 68)
          doc.text("Despesas", 20, yPos)
          yPos += 6
          doc.setTextColor(0, 0, 0)

          const expenseRows = tripExpenses.map((t) => [
            t.category || "—",
            t.description || "—",
            formatBRL(t.amount || 0),
          ])

          autoTable(doc, {
            startY: yPos,
            head: [["Categoria", "Descrição", "Valor"]],
            body: expenseRows,
            theme: "grid",
            headStyles: { fillColor: [239, 68, 68] },
            margin: { left: 20, right: 20 },
            columnStyles: {
              0: { cellWidth: 45, fontStyle: "bold" },
              2: { cellWidth: 35, halign: "right" },
            },
            foot: [["", "Total Despesas", formatBRL(totalExpenses)]],
            footStyles: { fillColor: [254, 226, 226], textColor: [153, 27, 27], fontStyle: "bold" },
          })
          yPos = (doc as any).lastAutoTable.finalY + 10
        }

        // Resumo / Lucro
        if (yPos > 250) {
          doc.addPage()
          yPos = 20
        }

        const profitColor: [number, number, number] =
          profit >= 0 ? [34, 197, 94] : [239, 68, 68]
        const profitBg: [number, number, number] =
          profit >= 0 ? [220, 252, 231] : [254, 226, 226]
        const profitText: [number, number, number] =
          profit >= 0 ? [22, 101, 52] : [153, 27, 27]

        autoTable(doc, {
          startY: yPos,
          head: [["Resumo Financeiro", "Valor"]],
          body: [
            ["Total de Receitas", formatBRL(totalRevenues)],
            ["Total de Despesas", formatBRL(totalExpenses)],
          ],
          theme: "grid",
          headStyles: { fillColor: [168, 85, 247] },
          margin: { left: 20, right: 20 },
          columnStyles: {
            0: { cellWidth: 100, fontStyle: "bold" },
            1: { cellWidth: 60, halign: "right" },
          },
          foot: [[profit >= 0 ? "Lucro Líquido" : "Prejuízo", formatBRL(profit)]],
          footStyles: {
            fillColor: profitBg,
            textColor: profitText,
            fontStyle: "bold",
            fontSize: 12,
          },
        })
        yPos = (doc as any).lastAutoTable.finalY + 15
        doc.setTextColor(0, 0, 0)
      }

      // Registered by
      if (trip.createdBy) {
        doc.setFontSize(9)
        doc.setFont("helvetica", "italic")
        doc.setTextColor(150, 150, 150)
        doc.text(`Registrado por: ${trip.createdBy}`, 20, yPos)
      }

      const filename = `viagem-${tripId}-${trip.truckPlate || "frota"}.pdf`
      doc.save(filename)
    },
    [generateHeader],
  )

  return {
    generateDashboardReport,
    generateFinanceReport,
    generateTripsReport,
    generateSingleTripReport,
    generateTrucksReport,
    generateDriversReport,
    generateMachineryReport,
    generateRentalsReport,
  }
}
