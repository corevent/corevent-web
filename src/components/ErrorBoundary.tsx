import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryState {
  hasError: boolean
}

/** Last-resort fallback so a rendering error never leaves the user on a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) console.error(error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-4">
        <div role="alert" className="max-w-sm w-full bg-white rounded-2xl border border-zinc-200 p-6 text-center space-y-3">
          <h1 className="text-base font-bold text-zinc-950">Algo deu errado</h1>
          <p className="text-xs text-zinc-500">
            Ocorreu um erro inesperado ao exibir esta página. Recarregue para continuar; seus dados salvos não foram
            afetados.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold"
          >
            Recarregar página
          </button>
        </div>
      </div>
    )
  }
}
