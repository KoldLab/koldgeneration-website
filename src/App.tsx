import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToolStore } from '@/store/useToolStore'
import { Moon, Sun } from 'lucide-react'

function App() {
  const { darkMode, toggleDarkMode, tools, addTool, removeTool } = useToolStore()
  const [newTool, setNewTool] = useState('')

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const handleAddTool = () => {
    if (newTool.trim()) {
      addTool(newTool.trim())
      setNewTool('')
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">Kold Generation Tools</h1>
          <Button variant="outline" size="icon" onClick={toggleDarkMode}>
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome to Your Personal Tools Website</CardTitle>
            <CardDescription>
              This is a React application built with shadcn/ui and Zustand for state management.
              Add your personal tools and utilities here!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTool}
                  onChange={(e) => setNewTool(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTool()}
                  placeholder="Add a new tool..."
                  className="flex-1 px-3 py-2 rounded-md border border-input bg-background"
                />
                <Button onClick={handleAddTool}>Add Tool</Button>
              </div>

              {tools.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Your Tools:</h3>
                  <div className="space-y-2">
                    {tools.map((tool, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-md border border-border">
                        <span>{tool}</span>
                        <Button variant="destructive" size="sm" onClick={() => removeTool(tool)}>
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tech Stack</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground">
              <li>⚛️ React 19 with TypeScript</li>
              <li>⚡ Vite for fast development</li>
              <li>🎨 Tailwind CSS for styling</li>
              <li>🧩 shadcn/ui for beautiful components</li>
              <li>🐻 Zustand for state management</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default App
