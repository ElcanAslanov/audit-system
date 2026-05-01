// app/login/page.tsx
import Image from 'next/image'
import { signIn } from './actions'
import {
  ArrowRight,
  BarChart3,
  Building2,
  ClipboardCheck,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react'

type LoginPageProps = {
  searchParams?: Promise<{
    message?: string
  }>
}

function errorMessage(message?: string) {
  if (message === 'could-not-authenticate-user') {
    return 'Email və ya şifrə yanlışdır.'
  }

  return null
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const message = errorMessage(params?.message)

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6f0e8]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[560px] w-[560px] animate-[blobOne_13s_ease-in-out_infinite] rounded-full bg-[#b91c1c]/20 blur-3xl" />
        <div className="absolute -bottom-44 -right-36 h-[620px] w-[620px] animate-[blobTwo_15s_ease-in-out_infinite] rounded-full bg-[#111827]/20 blur-3xl" />
        <div className="absolute left-[45%] top-[20%] h-[360px] w-[360px] animate-[blobThree_11s_ease-in-out_infinite] rounded-full bg-[#f59e0b]/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 animate-[softPulse_7s_ease-in-out_infinite] rounded-full bg-white/70 blur-3xl" />
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-[0.32]">
        <div className="h-full w-full bg-[linear-gradient(to_right,#11182712_1px,transparent_1px),linear-gradient(to_bottom,#11182712_1px,transparent_1px)] bg-[size:46px_46px]" />
      </div>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-full w-1/3 animate-[verticalShine_7s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/45 to-transparent blur-xl" />
      </div>

      <div className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <section className="relative hidden overflow-hidden p-8 lg:flex lg:animate-[slideFromLeft_950ms_cubic-bezier(0.22,1,0.36,1)_both] lg:flex-col lg:items-center lg:justify-center xl:p-12">
          <div className="absolute inset-6 rounded-[2.75rem] border border-white/70 bg-white/55 shadow-2xl shadow-slate-300/60 backdrop-blur-2xl" />

          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[16%] top-[15%] h-20 w-20 animate-[floatRotate_7s_ease-in-out_infinite] rounded-[1.5rem] border border-red-100 bg-white/80 shadow-xl shadow-red-100/60" />
            <div className="absolute right-[17%] top-[23%] h-14 w-14 animate-[floatRotate_8s_ease-in-out_infinite_300ms] rounded-full border border-amber-100 bg-amber-50/80 shadow-xl shadow-amber-100/70" />
            <div className="absolute bottom-[22%] left-[20%] h-16 w-16 animate-[floatRotate_9s_ease-in-out_infinite_700ms] rounded-[1.25rem] border border-red-100 bg-red-50/75 shadow-xl shadow-red-100/60" />
            <div className="absolute bottom-[16%] right-[24%] h-10 w-10 animate-[floatSmall_5s_ease-in-out_infinite_1000ms] rounded-full bg-slate-950/80 shadow-xl" />
          </div>

          <div className="relative z-10 flex max-w-xl flex-col items-center text-center">
            <div className="relative h-80 w-80 animate-[fadeScale_900ms_cubic-bezier(0.22,1,0.36,1)_300ms_both]">
              <div className="absolute inset-0 animate-[spinSlow_20s_linear_infinite] rounded-full border border-dashed border-[#b91c1c]/60" />
              <div className="absolute inset-7 animate-[spinReverse_17s_linear_infinite] rounded-full border border-dashed border-[#f59e0b]/70" />
              <div className="absolute inset-14 animate-[spinSlow_13s_linear_infinite] rounded-full border border-dashed border-slate-400/60" />
              <div className="absolute inset-20 animate-[softPulse_5s_ease-in-out_infinite] rounded-full bg-white/85 shadow-2xl shadow-slate-300/70 backdrop-blur" />

              <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2.75rem] border border-slate-200 bg-white shadow-2xl shadow-slate-300/60">
                <Image
                  src="/cahanlogo.jpg"
                  alt="Cahan logo"
                  fill
                  className="object-contain p-3"
                  priority
                />
              </div>

              <div className="absolute left-1/2 top-1 grid h-12 w-12 -translate-x-1/2 animate-[orbitFloat_4s_ease-in-out_infinite] place-items-center rounded-2xl bg-slate-950 text-white shadow-xl">
                <ShieldCheck size={20} />
              </div>

              <div className="absolute bottom-9 right-7 grid h-11 w-11 animate-[orbitFloat_4.5s_ease-in-out_infinite_300ms] place-items-center rounded-2xl bg-[#b91c1c] text-white shadow-xl">
                <ClipboardCheck size={19} />
              </div>

              <div className="absolute bottom-9 left-7 grid h-11 w-11 animate-[orbitFloat_5s_ease-in-out_infinite_600ms] place-items-center rounded-2xl bg-[#f59e0b] text-white shadow-xl">
                <Building2 size={19} />
              </div>
            </div>

            <div className="mt-8 animate-[fadeUp_800ms_ease-out_600ms_both]">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#b91c1c] shadow-sm">
                <BarChart3 size={14} />
                CAHAN AUDİT SİSTEM
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center p-4 sm:p-6 lg:animate-[slideFromRight_950ms_cubic-bezier(0.22,1,0.36,1)_both] lg:p-10">
          <div className="w-full max-w-md">
            <div className="mb-7 flex justify-center lg:hidden">
              <div className="flex animate-[fadeUp_700ms_ease-out_both] flex-col items-center text-center">
                <div className="relative h-24 w-24 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                  <Image
                    src="/cahanlogo.jpg"
                    alt="Cahan logo"
                    fill
                    className="object-contain p-2"
                    priority
                  />
                </div>
                <p className="mt-3 text-xl font-black text-slate-950">
                  Cahan Audit Sistem
                </p>
              </div>
            </div>

            <form
              action={signIn}
              className="relative animate-[fadeScale_900ms_cubic-bezier(0.22,1,0.36,1)_250ms_both] overflow-hidden rounded-[2.35rem] border border-white/80 bg-white/90 p-6 shadow-2xl shadow-slate-300/70 backdrop-blur-xl sm:p-8"
            >
              <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 animate-[softPulse_5s_ease-in-out_infinite] rounded-full bg-[#b91c1c]/15 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 animate-[softPulse_6s_ease-in-out_infinite] rounded-full bg-[#f59e0b]/18 blur-3xl" />

              <div className="relative">
                <div className="mx-auto mb-6 hidden h-28 w-28 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm lg:relative lg:block">
                  <Image
                    src="/cahanlogo.jpg"
                    alt="Cahan logo"
                    fill
                    className="object-contain p-2"
                    priority
                  />
                </div>



                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                  Xoş gəlmisiniz
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Hesabınıza daxil olaraq audit panelinə keçin.
                </p>
              </div>

              {message && (
                <div className="relative mt-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                  {message}
                </div>
              )}

              <div className="relative mt-6 space-y-4">
                <div className="animate-[fadeUp_650ms_ease-out_500ms_both]">
                  <label className="mb-1 block text-sm font-bold text-slate-700">
                    Email
                  </label>

                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-3.5 text-slate-400"
                      size={18}
                    />
                    <input
                      name="email"
                      type="email"
                      placeholder="cahan@audit.az"
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/90 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-[#b91c1c]/50 focus:bg-white focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                </div>

                <div className="animate-[fadeUp_650ms_ease-out_650ms_both]">
                  <label className="mb-1 block text-sm font-bold text-slate-700">
                    Şifrə
                  </label>

                  <div className="relative">
                    <LockKeyhole
                      className="absolute left-3 top-3.5 text-slate-400"
                      size={18}
                    />
                    <input
                      type="password"
                      name="password"
                      placeholder="Şifrənizi daxil edin"
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/90 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-[#b91c1c]/50 focus:bg-white focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="group relative mt-6 inline-flex w-full animate-[fadeUp_650ms_ease-out_800ms_both] items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-[#7f1d1d] to-[#b91c1c] px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-900/10 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-red-200"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition duration-700 group-hover:translate-x-full" />
                <span className="relative">Giriş et</span>
                <ArrowRight
                  size={17}
                  className="relative transition group-hover:translate-x-1"
                />
              </button>


            </form>
          </div>
        </section>
      </div>

      <style>{`
        @keyframes slideFromLeft {
          0% {
            opacity: 0;
            transform: translateX(-100px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes slideFromRight {
          0% {
            opacity: 0;
            transform: translateX(100px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes fadeScale {
          0% {
            opacity: 0;
            transform: translateY(24px) scale(0.94);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes floatRotate {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(8deg);
          }
        }

        @keyframes floatSmall {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-12px);
          }
        }

        @keyframes orbitFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-12px);
          }
        }

        @keyframes fadeUp {
          0% {
            opacity: 0;
            transform: translateY(22px);
          }
          100% {
            opacity: 1;
            transform: translateY(0px);
          }
        }

        @keyframes softPulse {
          0%, 100% {
            opacity: 0.55;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.14);
          }
        }

        @keyframes spinSlow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spinReverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        @keyframes blobOne {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          35% {
            transform: translate(60px, -20px) scale(1.12);
          }
          70% {
            transform: translate(20px, 50px) scale(0.96);
          }
        }

        @keyframes blobTwo {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          40% {
            transform: translate(-60px, 20px) scale(1.1);
          }
          75% {
            transform: translate(-20px, -45px) scale(0.95);
          }
        }

        @keyframes blobThree {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-35px, 45px) scale(1.12);
          }
        }

        @keyframes verticalShine {
          0% {
            transform: translateX(-140%);
            opacity: 0;
          }
          35% {
            opacity: 1;
          }
          70% {
            opacity: 0.8;
          }
          100% {
            transform: translateX(360%);
            opacity: 0;
          }
        }
      `}</style>
    </main>
  )
}