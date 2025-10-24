import { create } from 'zustand'

interface ToolState {
  darkMode: boolean
  toggleDarkMode: () => void
  tools: string[]
  addTool: (tool: string) => void
  removeTool: (tool: string) => void
}

export const useToolStore = create<ToolState>((set) => ({
  darkMode: false,
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  tools: [],
  addTool: (tool) => set((state) => ({ tools: [...state.tools, tool] })),
  removeTool: (tool) => set((state) => ({ 
    tools: state.tools.filter((t) => t !== tool) 
  })),
}))
