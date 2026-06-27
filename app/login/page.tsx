"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardTitle className="mb-6 text-center">N2 学習システム</CardTitle>
        <p className="mb-4 text-center text-sm text-zinc-500">
          ログインすると学習進捗をクラウドに同期できます。
          <br />
          ログインしなくても本機で学習できます。
        </p>
        <div className="space-y-3">
          <input
            type="email"
            placeholder="メールアドレス"
            className="w-full rounded border p-2 dark:bg-zinc-900"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="パスワード"
            className="w-full rounded border p-2 dark:bg-zinc-900"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            className="w-full"
            onClick={() => signIn("credentials", { email, password, callbackUrl: "/settings" })}
          >
            ログイン
          </Button>
        </div>
      </Card>
    </div>
  );
}
