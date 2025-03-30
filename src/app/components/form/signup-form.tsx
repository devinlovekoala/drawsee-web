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
import {useState} from "react";
import {toast} from "sonner";
import {UserSignUpDTO} from "@/api/types/auth.types.ts";
import {signup} from "@/api/methods/auth.methods.ts";

interface Props {
  className?: string;
  onSuccess: (token?: string) => void;
  switchToLogin: () => void;
}

function SignUpForm ({className, onSuccess, switchToLogin}: Props) {

  const initialForm = {
    username: '',
    password: '',
    passwordAgain: ''
  }
  const [form, setForm] = useState(initialForm);

  const handleSignUp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // 校验
    if (form.username === '') {
      toast.error("用户名不能为空");
      return;
    }
    if (form.password === '') {
      toast.error("密码不能为空");
      return;
    }
    if (form.password !== form.passwordAgain) {
      toast.error("两次输入的密码不一致");
      return;
    }

    const userSignUpDTO = {
      username: form.username,
      password: form.password
    } as UserSignUpDTO;
    signup(userSignUpDTO).then((response) => {
      toast.success("注册成功");
      onSuccess(response.token);
    }).catch((error: Error) => {
      toast.error(`注册失败，${error.message}`);
    });
  }

  return (
    <div className={cn(`flex flex-col gap-6`, className)}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">注册</CardTitle>
          <CardDescription>
            输入你的用户名和密码
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} action="">
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">用户名</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="请输入你的用户名"
                  required
                  value={form.username}
                  onChange={(event) => setForm({...form, username: event.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">密码</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="请输入你的密码"
                  required
                  value={form.password}
                  onChange={(event) => setForm({...form, password: event.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">再次输入密码</Label>
                </div>
                <Input
                  id="passwordAgain"
                  type="password"
                  placeholder="请再次输入你的密码"
                  required
                  value={form.passwordAgain}
                  onChange={(event) => setForm({...form, passwordAgain: event.target.value})}
                />
              </div>
              <Button type="submit" className="w-full">
                注册
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              已有账号？{" "}
              <span className="underline underline-offset-4 cursor-pointer" onClick={switchToLogin}>
                去登录
              </span>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default SignUpForm;