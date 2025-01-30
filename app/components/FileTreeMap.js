'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

export default function FileTreeMap({ analysis }) {
  const svgRef = useRef(null)

  useEffect(() => {
    if (!analysis?.files) return

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove()

    // Convert analysis data to hierarchical structure
    const data = {
      name: "root",
      children: Object.entries(analysis.files).map(([filename, fileAnalysis]) => ({
        name: filename,
        children: fileAnalysis?.dependencies?.referencedFiles?.map(ref => ({
          name: ref
        })) || []
      }))
    }

    // Set up SVG dimensions
    const width = 960
    const height = 600
    const margin = { top: 20, right: 90, bottom: 30, left: 90 }

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)

    // Create tree layout
    const treeLayout = d3.tree()
      .size([height - margin.top - margin.bottom, width - margin.left - margin.right])

    // Create root node
    const root = d3.hierarchy(data)

    // Generate tree data
    const treeData = treeLayout(root)

    // Create a group for the tree
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Add links
    g.selectAll('.link')
      .data(treeData.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#3A3D56')
      .attr('stroke-width', 1)
      .attr('d', d3.linkHorizontal()
        .x(d => d.y)
        .y(d => d.x))

    // Add nodes
    const nodes = g.selectAll('.node')
      .data(treeData.descendants())
      .enter()
      .append('g')
      .attr('class', d => `node ${d.children ? 'node--internal' : 'node--leaf'}`)
      .attr('transform', d => `translate(${d.y},${d.x})`)

    // Add circles for nodes
    nodes.append('circle')
      .attr('r', 4)
      .attr('fill', d => d.children ? '#4CAF50' : '#3A3D56')

    // Add labels
    nodes.append('text')
      .attr('dy', '.31em')
      .attr('x', d => d.children ? -6 : 6)
      .attr('text-anchor', d => d.children ? 'end' : 'start')
      .text(d => d.data.name)
      .style('font-size', '12px')
      .style('font-family', 'sans-serif')
      .style('fill', '#EAEAEA')

  }, [analysis])

  return (
    <div className="w-full overflow-x-auto bg-[#121212] rounded-lg shadow p-6">
      <svg ref={svgRef} className="w-full"></svg>
    </div>
  )
}
