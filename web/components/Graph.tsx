import { memo, useLayoutEffect, useRef } from 'react'
import cytoscape from 'cytoscape'
import { GraphData, GraphEdge, GraphNode } from '../@types'

type Props = {
  data: GraphData
  onTapSpace: () => void
}

const onTapNode = (node) => (location.hash = node.id())
const onTapEdge = (edge) => (location.hash = edge.id())
export const selected = (
  hash: string,
  data: GraphData
): null | ['node', GraphNode] | ['edge', GraphEdge] => {
  let match = hash.match(/^#user-([\d]+)$/)
  if (match) {
    const node = data.elements.nodes.find(
      (node) => node.data.user.id === match[1]
    )
    if (node) return ['node', node]
  }
  match = hash.match(/^#tweet-([\d]+)$/)
  if (match) {
    const edge = data.elements.edges.find(
      (edge) => edge.data.tweet.id === match[1]
    )
    if (edge) return ['edge', edge]
  }
  return null
}

const Graph = ({ data, onTapSpace }: Props) => {
  const cyRef = useRef(null)

  useLayoutEffect(() => {
    if (cyRef.current) {
      const cy = cytoscape({
        container: cyRef.current,
        autoungrabify: true,
        ...data,
        style: [
          {
            selector: 'node',
            style: {
              height: 80,
              width: 80,
              'background-fit': 'cover',
              'border-color': '#e5e7eb',
              'border-width': 2,
              'background-image': (ele) =>
                ele.data().user.profile_image_data_uri,
            },
          },
          {
            selector: 'node:selected',
            style: {
              height: 120,
              width: 120,
            },
          },
          {
            selector: 'edge',
            style: {
              width: 1,
              'curve-style': 'straight',
              'target-arrow-shape': 'triangle',
            },
          },
          {
            selector: 'edge:selected',
            style: {
              width: 3,
            },
          },
        ],
        layout: {
          name: 'concentric',
          concentric(node: any) {
            return node.data('user').inMentionIds.length
          },
          levelWidth(_nodes) {
            return 4
          },
        },
      })
      cy.on('tap', 'node', (e) => onTapNode(e.target))
      cy.on('tap', 'edge', (e) => onTapEdge(e.target))
      cy.on('tap', (e) => {
        if (e.target === cy) onTapSpace()
      })

      const selectByHash = () => {
        const match = selected(location.hash, data)
        cy.$(':selected').unselect()
        if (match && match[0] === 'node') {
          cy.$(`#${match[1].data.id}`).select()
        } else if (match && match[0] === 'edge') {
          cy.$(`#${match[1].data.id}`).select()
        }
      }

      selectByHash()
      window.addEventListener('hashchange', selectByHash, false)

      return () => {
        cy.destroy()
        window.removeEventListener('hashchange', selectByHash)
      }
    }
  }, [cyRef.current])

  return <div className="w-screen h-screen" ref={cyRef}></div>
}

export default memo(Graph)
