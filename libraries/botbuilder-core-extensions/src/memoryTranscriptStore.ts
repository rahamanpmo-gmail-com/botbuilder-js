/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TranscriptStore, PagedResult, Transcript } from "./transcriptLogger";
import { Activity } from "botbuilder-core";

/**
 * The memory transcript store stores transcripts in volatile memory in a Map.
 * Because this uses an unbounded volitile dictionary this should only be used for unit tests or non-production environments.
 */
export class MemoryTranscriptStore implements TranscriptStore {

    private channels: Map<string, Map<string, Array<Activity>>> = new Map<string, Map<string, Array<Activity>>>();

    /**
     * Log an activity to the transcript.
     * @param activity Activity to log.
     */
    logActivity(activity: Activity): void | Promise<void> {
        if (!activity) {
            throw new Error("activity cannot be null for logActivity()");
        }

        // get channel
        let channel: Map<string, Array<Activity>>;
        if (!this.channels.has(activity.channelId)) {
            channel = new Map<string, Array<Activity>>();
            this.channels.set(activity.channelId, channel);
        } else {
            channel = this.channels.get(activity.channelId);
        }

        // get conversation transcript
        let transcript: Array<Activity>;
        if (!channel.has(activity.conversation.id)) {
            transcript = []
            channel.set(activity.conversation.id, transcript);
        } else {
            transcript = channel.get(activity.conversation.id);
        }

        transcript.push(activity);
    }

    /**
     * Get activities from the memory transcript store
     * @param channelId Channel Id.
     * @param conversationId Conversation Id.
     * @param continuationToken Continuatuation token to page through results.
     * @param startDate Earliest time to include.
     */
    getTranscriptActivities(channelId: string, conversationId: string, continuationToken?: string, startDate?: Date): Promise<PagedResult<Activity>> {
        if (!channelId)
            throw new Error('Missing channelId');

        if (!conversationId)
            throw new Error('Missing conversationId');

        let pagedResult = new PagedResult<Activity>();
        if (this.channels.has(channelId)) {
            let channel = this.channels.get(channelId);
            if (channel.has(conversationId)) {
                let transcript = channel.get(conversationId);
                if (continuationToken) {
                    pagedResult.items = transcript
                        .sort(timestampSorter)
                        .filter(a => !startDate || a.timestamp >= startDate)
                        .filter(skipWhileExpression(a => a.id !== continuationToken))
                        .slice(1, 21);
                } else {
                    pagedResult.items = transcript
                        .sort(timestampSorter)
                        .filter(a => !startDate || a.timestamp >= startDate)
                        .slice(0, 20);
                }

                if (pagedResult.items.length == 20) {
                    pagedResult.continuationToken = pagedResult.items[pagedResult.items.length - 1].id;
                }
            }
        }

        return Promise.resolve(pagedResult);
    }

    /**
     * List conversations in the channelId.
     * @param channelId Channel Id.
     * @param continuationToken Continuatuation token to page through results.
     */
    listTranscripts(channelId: string, continuationToken?: string): Promise<PagedResult<Transcript>> {
        if (!channelId)
            throw new Error('Missing channelId');

        let pagedResult = new PagedResult<Transcript>();
        if (this.channels.has(channelId)) {
            let channel = this.channels.get(channelId);

            if (continuationToken) {
                pagedResult.items = Array.from(channel.entries()).map(kv => ({
                    channelId,
                    id: kv[0],
                    created: getDate(kv[1])
                })).sort(createdSorter)
                    .filter(skipWhileExpression(a => a.id !== continuationToken))
                    .slice(1, 21);
            } else {
                pagedResult.items = Array.from(channel.entries()).map(kv => ({
                    channelId,
                    id: kv[0],
                    created: getDate(kv[1])
                })).sort(createdSorter)
                    .slice(0, 20);
            }

            if (pagedResult.items.length == 20) {
                pagedResult.continuationToken = pagedResult.items[pagedResult.items.length - 1].id;
            }
        }

        return Promise.resolve(pagedResult);
    }

    /**
     * Delete a specific conversation and all of it's activities.
     * @param channelId Channel Id where conversation took place.
     * @param conversationId Id of the conversation to delete.
     */
    deleteTranscript(channelId: string, conversationId: string): Promise<void> {
        if (!channelId)
            throw new Error('Missing channelId');

        if (!conversationId)
            throw new Error('Missing conversationId');

        if (this.channels.has(channelId)) {
            var channel = this.channels.get(channelId);
            if (channel.has(conversationId)) {
                channel.delete(conversationId);
            }
        }

        return Promise.resolve();
    }
}

const createdSorter = (a: Transcript, b: Transcript): number =>
    a.created.getTime() - b.created.getTime();

const timestampSorter = (a: Activity, b: Activity): number =>
    a.timestamp.getTime() - b.timestamp.getTime();

const skipWhileExpression = (expression) => {
    let skipping = true;
    return (item) => {
        if (!skipping) return true;
        if (!expression(item)) {
            skipping = false;
        }
        return false;
    };
}

const getDate = (activities: Activity[]): Date => {
    if (activities && activities.length > 0) {
        return activities[0].timestamp || new Date(0);
    }

    return new Date(0);
}