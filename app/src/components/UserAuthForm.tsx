'use client'
import { cn } from "@/lib/utils"
import { Button } from "./ui/button"
import { FC, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { BuiltInProviderType } from 'next-auth/providers'
interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
    providerType: BuiltInProviderType
    signIn: () => Promise<void>
}
const UserAuthForm: FC<UserAuthFormProps> = ({ className, signIn, providerType, ...props }) => {


    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()
    const handleSignIn = async () => {
        setIsLoading(true)
        try {
            await signIn()
        } catch (error) {
            // throw error toast
            toast({
                title: 'An error occured :(',
                description: 'There was an problem while signing in, please try again ',
                variant: 'destructive'
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className={cn('flex justify-center', className)} {...props}>
            <Button disabled={isLoading} size='sm' onClick={handleSignIn} className="w-full" isLoading={isLoading}>
                Continue with {providerType}
            </Button>
        </div>
    )
}
export default UserAuthForm