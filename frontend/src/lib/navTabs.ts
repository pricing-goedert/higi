/**
 * Ordem das abas da navegação principal, da esquerda para a direita.
 *
 * BottomNav (mobile) e AppSidebar (desktop) renderizam esses mesmos cinco
 * destinos nessa mesma ordem — eles mantêm as próprias listas porque os
 * rótulos e os ícones diferem, mas a *ordem* mora aqui porque é dela que sai
 * o sentido da transição entre telas (composables/useTransicaoTela.ts): ir
 * para uma aba à direita desliza para um lado, para a esquerda, para o outro.
 * Mexer na ordem em um dos dois componentes sem mexer aqui deixa a animação
 * apontando para o lado errado.
 */
export const ordemAbas = ['home', 'representantes', 'clientes', 'leads', 'perfil'] as const
