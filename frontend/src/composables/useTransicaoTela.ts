import { ref } from 'vue'
import type { RouteLocationNormalized, Router } from 'vue-router'
import { ordemAbas } from '@/lib/navTabs'

/**
 * Índice da aba a que uma rota pertence, ou -1 se ela não é uma das cinco
 * abas. Usa `matched` (e não `name`) pelo mesmo motivo que BottomNav usa: é o
 * que faz uma rota-filha contar como a aba pai.
 */
function indiceAba(rota: RouteLocationNormalized) {
  return ordemAbas.findIndex((nome) => rota.matched.some((registro) => registro.name === nome))
}

/**
 * Nome da transição a aplicar no RouterView, decidido pela posição relativa
 * das duas abas na barra inferior: tocar num ícone à direita do atual traz a
 * tela nova da direita ("tela-esquerda", o conteúdo caminha para a esquerda),
 * e vice-versa.
 *
 * Fora das abas (telas de detalhe, catálogo, mapa...) devolve string vazia, ou
 * seja, nenhuma animação: entrar num detalhe continua instantâneo como hoje, e
 * um deslize horizontal ali significaria a coisa errada — não foi um passo
 * lateral na navegação, foi um passo para dentro dela.
 *
 * Roda em `afterEach`: nesse ponto a navegação já está confirmada, e a
 * atribuição acontece antes do flush de render do Vue que troca o componente,
 * então o <Transition> já lê o nome novo na mesma troca.
 */
export function useTransicaoTela(router: Router) {
  const transicao = ref('')

  router.afterEach((para, de) => {
    const destino = indiceAba(para)
    const origem = indiceAba(de)

    if (destino === -1 || origem === -1 || destino === origem) {
      transicao.value = ''
      return
    }

    transicao.value = destino > origem ? 'tela-esquerda' : 'tela-direita'
  })

  return transicao
}
