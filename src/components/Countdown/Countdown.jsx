import { useState, useEffect, useRef } from 'react'

export default function Countdown() {
  const [totalSeconds, setTotalSeconds] = useState(15 * 60)
  const intervalRef = useRef(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTotalSeconds(prev => {
        if (prev <= 0) return 0
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [])

  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')

  const diasSemana = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO']
  const diaAtual = diasSemana[new Date().getDay()]

  return (
    <div className="countdown-b">
      <div className="countdown-b-left">
        <span className="countdown-b-line1">PROMOÇÃO <strong>{diaAtual}</strong> EM DOBRO</span>
        <span className="countdown-b-line2">ACABA EM:</span>
      </div>
      <div className="countdown-b-right">
        <span className="countdown-b-num">{minutes}</span>
        <span className="countdown-b-sep">:</span>
        <span className="countdown-b-num">{seconds}</span>
      </div>
    </div>
  )
}
