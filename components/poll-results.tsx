import { Progress } from "@/components/ui/progress"

interface Poll {
  id: string
  question: string
  options: string[]
  isActive: boolean
  timeLimit: number
  results: Record<string, number>
  totalVotes: number
}

interface PollResultsProps {
  poll: Poll
}

export function PollResults({ poll }: PollResultsProps) {
  const { results, totalVotes, options } = poll

  if (totalVotes === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No responses yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {options.map((option, index) => {
        const count = results[option] || 0
        const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0

        return (
          <div key={index} className="flex items-center gap-4">
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
              {String.fromCharCode(65 + index)}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{option}</span>
                <span className="text-sm font-medium text-gray-600">{percentage}%</span>
              </div>
              <div className="relative">
                <Progress value={percentage} className="h-8 bg-gray-light" />
                <div
                  className="absolute top-0 left-0 h-8 bg-primary rounded-md transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
