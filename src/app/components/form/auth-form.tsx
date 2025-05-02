import {useState, useRef} from "react";
import {toast} from "sonner";
import {login, signup} from "@/api/methods/auth.methods.ts";
import {LoginVO, UserSignUpDTO} from "@/api/types/auth.types.ts";
import {cn} from "@/lib/utils.ts";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/pages/auth/components/ui/card.tsx";
import {motion, AnimatePresence} from "framer-motion";

interface Props {
	className?: string;
	onSuccess: (data: LoginVO) => void;
}

function AuthForm({className, onSuccess}: Props) {
	const [isLogin, setIsLogin] = useState(true);
	const [loading, setLoading] = useState(false);
	const [form, setForm] = useState({
		username: '',
		password: '',
		passwordConfirm: ''
	});
	
	// 使用ref跟踪表单提交状态，防止重复提交
	const isSubmitting = useRef(false);

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		
		// 如果已经在提交中，直接返回
		if (isSubmitting.current || loading) {
			return;
		}
		
		// 标记开始提交
		isSubmitting.current = true;
		setLoading(true);

		if (form.username === '') {
			toast.error("用户名不能为空");
			setLoading(false);
			isSubmitting.current = false;
			return;
		}
		if (form.password === '') {
			toast.error("密码不能为空");
			setLoading(false);
			isSubmitting.current = false;
			return;
		}

		if (isLogin) {
			login(form.username, form.password)
				.then((data) => {
					toast.success("登录成功");
					// 登录成功直接回调，不重置表单状态
					onSuccess(data);
				})
				.catch((error: Error) => {
					toast.error(`登录失败，${error.message}`);
					isSubmitting.current = false;
					setLoading(false);
				});
		} else {
			if (form.password !== form.passwordConfirm) {
				toast.error("两次输入的密码不一致");
				setLoading(false);
				isSubmitting.current = false;
				return;
			}

			const userSignUpDTO = {
				username: form.username,
				password: form.password
			} as UserSignUpDTO;

			signup(userSignUpDTO)
				.then((data) => {
					toast.success("注册成功");
					// 注册成功直接回调，不重置表单状态
					onSuccess(data);
				})
				.catch((error: Error) => {
					toast.error(`注册失败，${error.message}`);
					isSubmitting.current = false;
					setLoading(false);
				});
		}
	};

	return (
		<div className={cn(`flex flex-col gap-6 bg-white`, className)}>
			<Card>
				<CardHeader>
					<CardTitle className="text-2xl">
						{isLogin ? "欢迎回来" : "创建账号"}
					</CardTitle>
					<CardDescription>
						{isLogin ? "请输入您的用户名和密码" : "请填写以下信息完成注册"}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<AnimatePresence mode="wait">
						<motion.form
							key={isLogin ? "login" : "register"}
							initial={{opacity: 0, x: isLogin ? -20 : 20}}
							animate={{opacity: 1, x: 0}}
							exit={{opacity: 0, x: isLogin ? 20 : -20}}
							transition={{duration: 0.3, ease: "easeInOut"}}
							className="space-y-4"
							onSubmit={handleSubmit}
						>
							<div className="space-y-2">
								<label
									className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									htmlFor="username"
								>
									用户名
								</label>
								<input
									className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
									type="text"
									placeholder="请输入用户名"
									value={form.username}
									onChange={(e) => setForm(prev => ({...prev, username: e.target.value}))}
									disabled={loading}
									required
								/>
							</div>
							<div className="space-y-2">
								<label
									className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									htmlFor="password"
								>
									密码
								</label>
								<input
									className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
									type="password"
									placeholder="请输入密码"
									value={form.password}
									onChange={(e) => setForm(prev => ({...prev, password: e.target.value}))}
									disabled={loading}
									required
								/>
							</div>
							{!isLogin && (<>
								<div className="space-y-2">
									<label
										className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
										htmlFor="passwordConfirm"
									>
										确认密码
									</label>
									<input
										className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
										type="password"
										placeholder="请再次输入密码"
										value={form.passwordConfirm}
										onChange={(e) => setForm(prev => ({...prev, passwordConfirm: e.target.value}))}
										disabled={loading}
										required
									/>
								</div>
							</>)}
							<button
								type="submit"
								className={`inline-flex w-full items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
									loading ? "opacity-50 cursor-not-allowed" : ""
								}`}
								disabled={loading}
							>
								{loading ? "处理中..." : isLogin ? "登录" : "注册"}
							</button>
						</motion.form>
					</AnimatePresence>

					<div className="relative my-4">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-white px-2 text-neutral-500">或</span>
						</div>
					</div>

					<button
						type="button"
						className="inline-flex w-full justify-center text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
						onClick={() => {
							// 切换表单模式时，如果正在加载则不允许
							if (loading) return;
							setIsLogin(!isLogin);
							setForm({username: '', password: '', passwordConfirm: ''});
						}}
						disabled={loading}
					>
						{isLogin ? "还没有账号？点击注册" : "已有账号？点击登录"}
					</button>
				</CardContent>
			</Card>
		</div>
	);
}

export default AuthForm;