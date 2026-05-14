'use client'

import {useEffect} from 'react'

type Props = {
  answerId?: string | null
}

export default function ScrollToAnswer({answerId}: Props) {
  useEffect(() => {
    if (!answerId) return

    const timer = window.setTimeout(() => {
      const element = document.getElementById(`answer-${answerId}`)

      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
    }, 250)

    return () => window.clearTimeout(timer)
  }, [answerId])

  return null
}