'use client'

import { useRouter } from "next/navigation"
import { Button } from "./ui/button"
import { ArrowLeftIcon } from "lucide-react"

interface NavigateBackProps {
  href?: string
  subHeading?: string
}

const NavigateBack = (props: NavigateBackProps) => {
  const { href, subHeading } = props
  const router = useRouter()

  const handleBack = () => {
    href ? router.push(href) : router.back()
  }

  return (
    <div className="flex justify-between items-center w-full">
        <Button className="flex gap-4" variant={"ghost"} onClick={handleBack}>
          <ArrowLeftIcon className="w-6 h-6" />
          Back
        </Button>
        {subHeading && <div className="w-full flex justify-center items-center text-2xl font-bold">{subHeading}</div>}
    </div>
  )
}

export default NavigateBack