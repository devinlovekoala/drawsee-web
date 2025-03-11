import {useCallback, useState} from "react";
import {toast} from "sonner";
import {login, signup} from "@/api/methods/auth.methods.ts";
import {UserSignUpDTO} from "@/api/types/auth.types.ts";
import {cn} from "@/lib/utils.ts";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/pages/auth/components/ui/card.tsx";
import {Label} from "@/pages/auth/components/ui/label.tsx";
import {Input} from "@/pages/auth/components/ui/input.tsx";
import {Button} from "@/pages/auth/components/ui/button.tsx";

interface Props {
	className?: string;
	onSuccess: (token?: string) => void;
}

function AuthForm ({className, onSuccess}: Props) {

	const [curTab, setCurTab] = useState<"login"|"signup">("login");
	
	const initSignUpForm = {
		username: '',
		password: '',
		passwordAgain: ''
	}
	const [signUpForm, setSignUpForm] = useState(initSignUpForm);

	const initLoginForm = {
		username: '',
		password: ''
	}
	const [loginForm, setLoginForm] = useState(initLoginForm);

	const handleSignUp = useCallback(() => {
		// 校验
		if (signUpForm.username === '') {
			toast.error("用户名不能为空");
			return;
		}
		if (signUpForm.password === '') {
			toast.error("密码不能为空");
			return;
		}
		if (signUpForm.password !== signUpForm.passwordAgain) {
			toast.error("两次输入的密码不一致");
			return;
		}

		const userSignUpDTO = {
			username: signUpForm.username,
			password: signUpForm.password
		} as UserSignUpDTO;
		signup(userSignUpDTO).then((response) => {
			toast.success("注册成功");
			onSuccess(response.token);
		}).catch((error: Error) => {
			toast.error(`注册失败，${error.message}`);
		});
	}, [onSuccess, signUpForm.password, signUpForm.passwordAgain, signUpForm.username]);
	
	const handleLogin = useCallback(() => {
		// 校验
		if (loginForm.username === '') {
			toast.error("用户名不能为空");
			return;
		}
		if (loginForm.password === '') {
			toast.error("密码不能为空");
			return;
		}

		login(loginForm.username, loginForm.password).then((response) => {
			toast.success("登录成功");
			onSuccess(response.token);
		}).catch((error: Error) => {
			toast.error(`登录失败，${error.message}`);
		});
	}, [loginForm.password, loginForm.username, onSuccess]);

	return (
		<div className={cn(`flex flex-col gap-6 bg-white`, className)}>
			<Card>
				<CardHeader>
					<CardTitle className="text-2xl">
						{
							curTab === "login" ? "登录" : "注册"
						}
					</CardTitle>
					<CardDescription>
						{
							curTab === "login" ? "使用你的用户名和密码登录" : "创建一个新账户"
						}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={(event) => {
						event.preventDefault();
						if (curTab === "login") {
							handleLogin();
						} else {
							handleSignUp();
						}
					}} action="">
						<div className="flex flex-col gap-6">
							{
								curTab === "login" ?
								<>
									<div className="grid gap-2">
										<Label htmlFor="email">用户名</Label>
										<Input
											id="username"
											type="text"
											placeholder="请输入你的用户名"
											required
											value={loginForm.username}
											onChange={(event) => setLoginForm(prev => ({...prev, username: event.target.value}))}
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
											value={loginForm.password}
											onChange={(event) => setLoginForm(prev => ({...prev, password: event.target.value}))}
										/>
									</div>
									<Button type="submit" className="w-full">
										登录
									</Button>
								</>
								:
								<>
									<div className="grid gap-2">
										<Label htmlFor="email">用户名</Label>
										<Input
											id="username"
											type="text"
											placeholder="请输入你的用户名"
											required
											value={signUpForm.username}
											onChange={(event) => setSignUpForm(prev => ({...prev, username: event.target.value}))}
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
											value={signUpForm.password}
											onChange={(event) => setSignUpForm(prev => ({...prev, password: event.target.value}))}
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
											value={signUpForm.passwordAgain}
											onChange={(event) => setSignUpForm(prev => ({...prev, passwordAgain: event.target.value}))}
										/>
									</div>
									<Button type="submit" className="w-full">
										注册
									</Button>
								</>
							}
						</div>
						<div className="mt-4 text-center text-sm">
							{
								curTab === "login" ?
								<>
									没有账号？{" "}
									<span className="underline underline-offset-4 cursor-pointer"
												onClick={() => setCurTab("signup")}>
										去注册
									</span>
								</>
								:
								<>
									已有账号？{" "}
									<span className="underline underline-offset-4 cursor-pointer"
												onClick={() => setCurTab("login")}>
										去登录
									</span>
								</>
							}
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);

}

export default AuthForm;