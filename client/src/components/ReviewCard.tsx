import { StarRating } from "./StarRating";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { faIR } from "date-fns/locale";

interface ReviewUser {
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
}

interface ReviewCardProps {
    id: number;
    rating: number;
    comment?: string;
    createdAt: string;
    user: ReviewUser;
    onDelete?: (id: number) => void;
    canDelete?: boolean;
}

export function ReviewCard({
    id,
    rating,
    comment,
    createdAt,
    user,
    onDelete,
    canDelete = false
}: ReviewCardProps) {
    const displayName = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.username;

    const initials = displayName.slice(0, 2).toUpperCase();

    const timeAgo = formatDistanceToNow(new Date(createdAt), {
        addSuffix: true,
        locale: faIR
    });

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-primary/10">
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-sm">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                            {displayName}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                            <StarRating value={rating} readonly size="sm" />
                            <span className="text-xs text-gray-400">{timeAgo}</span>
                        </div>
                    </div>
                </div>

                {canDelete && onDelete && (
                    <button
                        onClick={() => onDelete(id)}
                        className="text-xs text-red-500 hover:text-red-600 hover:underline"
                    >
                        حذف
                    </button>
                )}
            </div>

            {/* Comment */}
            {comment && (
                <p className="mt-3 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {comment}
                </p>
            )}
        </div>
    );
}
