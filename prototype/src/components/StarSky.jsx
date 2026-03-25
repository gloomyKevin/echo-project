import { useRef, useEffect, useCallback, useMemo } from 'react'
import useStore from '../store/useStore'
import CARDS from '../data/cards'

// 动作原子 → 星图区域
const ACTION_REGIONS = {
  explore: { cx: 0.2, cy: 0.18 }, taste: { cx: 0.72, cy: 0.14 },
  create: { cx: 0.82, cy: 0.48 }, connect: { cx: 0.48, cy: 0.28 },
  move: { cx: 0.15, cy: 0.58 }, observe: { cx: 0.55, cy: 0.68 },
  reflect: { cx: 0.32, cy: 0.82 },
}

const EMOTION_COLORS = {
  heal: '#5B9CF5', happy: '#F59E42', relief: '#4ADE80',
  tired: '#C9CDD4', breakthrough: '#A78BFA', plain: '#C9CDD4',
}

export function getStarPos(card, i) {
  const r = ACTION_REGIONS[card?.actions?.primary] || { cx: 0.5, cy: 0.5 }
  const ox = ((i * 137.5) % 100 - 50) / 400
  const oy = ((i * 73.1) % 100 - 50) / 400
  return {
    x: Math.max(0.08, Math.min(0.92, r.cx + ox)),
    y: Math.max(0.08, Math.min(0.92, r.cy + oy)),
  }
}

// 背景星
function generateBgStars(count) {
  const stars = []
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random(), y: Math.random(),
      r: 0.4 + Math.random() * 1.2,
      baseAlpha: 0.06 + Math.random() * 0.2,
      speed: 0.3 + Math.random() * 1.5,
      phase: Math.random() * Math.PI * 2,
    })
  }
  return stars
}

// 画四角星
function drawFourPointStar(ctx, cx, cy, outerR, innerR) {
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? outerR : innerR
    const angle = (Math.PI / 4) * i - Math.PI / 2
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
}

export default function StarSky() {
  const canvasRef = useRef(null)
  const bgStarsRef = useRef(generateBgStars(130))
  const frameRef = useRef(null)
  const cameraRef = useRef(useStore.getState().camera)
  const starsRef = useRef(useStore.getState().stars)

  // 订阅 store 变化，但不触发 re-render
  useEffect(() => {
    const unsub1 = useStore.subscribe((state) => { cameraRef.current = state.camera })
    const unsub2 = useStore.subscribe((state) => { starsRef.current = state.stars })
    return () => { unsub1(); unsub2() }
  }, [])

  const getCardById = useCallback((id) => CARDS.find(c => c.id === id), [])

  const draw = useCallback((time) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, w, h)

    const t = time / 1000
    const cam = cameraRef.current
    const stars = starsRef.current

    // ── 背景星 ──
    bgStarsRef.current.forEach(star => {
      const twinkle = Math.sin(t * star.speed + star.phase)
      const alpha = star.baseAlpha * (0.6 + 0.4 * twinkle) * cam.opacity
      const yFade = 1 - star.y * 0.5
      const finalAlpha = Math.max(0, alpha * yFade)
      if (finalAlpha < 0.01) return

      const sx = star.x * w
      const sy = (star.y * h * cam.scale) + cam.offsetY

      ctx.fillStyle = `rgba(210, 215, 225, ${finalAlpha})`
      ctx.beginPath()
      ctx.arc(sx, sy, star.r, 0, Math.PI * 2)
      ctx.fill()
    })

    // ── 用户星星 ──
    if (cam.userOpacity < 0.02) { frameRef.current = requestAnimationFrame(draw); return }

    const brightStars = stars.filter(s => s.type === 'bright')
    const darkStars = stars.filter(s => s.type === 'dark')

    // 连线
    for (let i = 0; i < brightStars.length; i++) {
      for (let j = i + 1; j < brightStars.length; j++) {
        const a = getCardById(brightStars[i].cardId)
        const b = getCardById(brightStars[j].cardId)
        if (a && b && a.actions.primary === b.actions.primary) {
          const pa = getStarPos(a, i)
          const pb = getStarPos(b, j)
          const sx1 = pa.x * w, sy1 = (pa.y * h * cam.scale) + cam.offsetY
          const sx2 = pb.x * w, sy2 = (pb.y * h * cam.scale) + cam.offsetY
          ctx.strokeStyle = `rgba(255,255,255,${0.1 * cam.userOpacity})`
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.moveTo(sx1, sy1)
          ctx.lineTo(sx2, sy2)
          ctx.stroke()
        }
      }
    }

    // 暗星
    darkStars.forEach((star, i) => {
      const card = getCardById(star.cardId)
      if (!card) return
      const pos = getStarPos(card, brightStars.length + i)
      const sx = pos.x * w
      const sy = (pos.y * h * cam.scale) + cam.offsetY
      if (sy < -20 || sy > h + 20) return

      const age = Date.now() - star.date
      let dim = age > 21 * 864e5 ? 0.15 : age > 7 * 864e5 ? 0.25 : 0.4
      // 闪烁
      if (age > 7 * 864e5) {
        dim *= 0.6 + 0.4 * Math.sin(t * 0.8 + i * 2.1)
      } else {
        dim *= 0.8 + 0.2 * Math.sin(t * 0.5 + i * 1.7) // 呼吸
      }
      const alpha = dim * cam.userOpacity

      // 四角星
      ctx.fillStyle = `rgba(200, 205, 215, ${alpha})`
      drawFourPointStar(ctx, sx, sy, 3.5, 1.2)
      ctx.fill()
    })

    // 亮星
    brightStars.forEach((star, i) => {
      const card = getCardById(star.cardId)
      if (!card) return
      const pos = getStarPos(card, i)
      const sx = pos.x * w
      const sy = (pos.y * h * cam.scale) + cam.offsetY
      if (sy < -20 || sy > h + 20) return

      const color = EMOTION_COLORS[star.emotion] || '#C9CDD4'
      const alpha = cam.userOpacity
      const twinkle = 0.85 + 0.15 * Math.sin(t * 1.2 + i * 3.7)
      const size = card.context.intensity > 0.5 ? 5 : card.context.intensity > 0.25 ? 4 : 3

      // 外圈光晕
      const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, size * 5)
      grad.addColorStop(0, color + Math.round(alpha * twinkle * 40).toString(16).padStart(2, '0'))
      grad.addColorStop(1, 'transparent')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(sx, sy, size * 5, 0, Math.PI * 2)
      ctx.fill()

      // 十字光芒
      const rayLen = size * 2.5 * twinkle
      ctx.strokeStyle = color + Math.round(alpha * twinkle * 80).toString(16).padStart(2, '0')
      ctx.lineWidth = 0.6
      ctx.beginPath()
      ctx.moveTo(sx - rayLen, sy); ctx.lineTo(sx + rayLen, sy)
      ctx.moveTo(sx, sy - rayLen); ctx.lineTo(sx, sy + rayLen)
      ctx.stroke()

      // 四角星核心
      ctx.fillStyle = color + Math.round(alpha * twinkle * 255).toString(16).padStart(2, '0')
      drawFourPointStar(ctx, sx, sy, size, size * 0.35)
      ctx.fill()
    })

    frameRef.current = requestAnimationFrame(draw)
  }, [getCardById])

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameRef.current)
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
