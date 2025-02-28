import { cn } from "@/lib/utils.ts"
import { Button } from "@/pages/auth/components/ui/button.tsx"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/pages/auth/components/ui/card.tsx"
import { Input } from "@/pages/auth/components/ui/input.tsx"
import { Label } from "@/pages/auth/components/ui/label.tsx"

function SignUpForm ({
    className,
    ...props
  }: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn(`flex flex-col gap-6`, className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">注册</CardTitle>
          <CardDescription>
            输入你的用户名和密码
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">用户名</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="请输入你的用户名"
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">密码</Label>
                </div>
                <Input id="password" type="password" placeholder="请输入你的密码" required/>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">再次输入密码</Label>
                </div>
                <Input id="passwordAgain" type="password" placeholder="请再次输入你的密码" required/>
              </div>
              <Button type="submit" className="w-full">
                注册
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default SignUpForm;