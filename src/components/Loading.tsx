import { Loader2 }  from "lucide-react";

import { Card } from '@/components/ui/card';

export function FullScreenSpinner() {
	return (
		<div className="flex items-center justify-center min-h-screen">
			<Loader2 className="h-12 w-12 animate-spin text-gray-500" />
		</div>
	);
}

export function PostSkeleton() {
	return (
		<Card className="p-4 space-y-4 animate-pulse">
			<div className="flex space-x-3">
				<div className="h-10 w-10 bg-gray-300 rounded-full" />
				<div className="flex-1 space-y-2">
					<div className="h-4 bg-gray-300 rounded w-1/4" />
					<div className="h-4 bg-gray-300 rounded w-1/2" />
				</div>
			</div>
			<div className="h-4 bg-gray-300 rounded w-full" />
			<div className="h-4 bg-gray-300 rounded w-3/4" />
		</Card>
	);
}

