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
import {useNavigate} from "react-router-dom";

function LoginForm ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {

  const navigate = useNavigate();

  return (
    <div className={cn(`flex flex-col gap-6`, className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">登录</CardTitle>
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
                  {/*<a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>*/}
                </div>
                <Input id="password" type="password" placeholder="请输入你的密码" required />
              </div>
              <Button type="submit" className="w-full">
                登录
              </Button>

            </div>
            <div className="mt-4 text-center text-sm">
              没有账号？{" "}
              <span className="underline underline-offset-4 cursor-pointer" onClick={() => navigate('/auth/signup')}>
                注册
              </span>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginForm;