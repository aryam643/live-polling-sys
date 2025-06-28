import { Card, CardContent } from "@/components/ui/card"
import { PollResults } from "./poll-results"

interface Poll {
  id: string
  question: string
  options: string[]
  isActive: boolean
  timeLimit: number
  results: Record<string, number>
  totalVotes: number
  createdAt: string
}

interface PollHistoryProps {
  polls: Poll[]
}

export function PollHistory({ polls }: PollHistoryProps) {
  if (polls.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Poll History</h3>
          <p className="text-gray-600">Create your first poll to see results here</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">View Poll History</h2>

      <div className="space-y-6">
        {polls.map((poll, index) => (
          <Card key={poll.id}>
            <CardContent className="p-0">
              <div className="bg-gray-dark text-white p-4 rounded-t-lg">
                <h3 className="text-lg font-medium">Question {index + 1}</h3>
                <p className="text-sm opacity-90">{poll.question}</p>
              </div>

              <div className="p-6">
                <PollResults poll={poll} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
