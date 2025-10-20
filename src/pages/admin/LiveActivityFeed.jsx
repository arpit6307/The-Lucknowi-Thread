import React, { useState, useEffect } from 'react';
import { Card, ListGroup, Spinner, Badge } from 'react-bootstrap';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

// Helper function to show relative time
const timeSince = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "just now";
};

// Icons for different activity types
const getActivityIcon = (type) => {
    switch (type) {
        case 'newOrder': return '📦'; // Box
        case 'newUser': return '👤'; // User silhouette
        case 'wishlist': return '❤️'; // Heart
        default: return '🔔'; // Bell
    }
};

const LiveActivityFeed = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, 'activityFeed'),
            orderBy('timestamp', 'desc'),
            limit(15) // Hamesha latest 15 activities dikhayein
        );

        // onSnapshot real-time listener hai
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const activitiesList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setActivities(activitiesList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching live activity:", error);
            setLoading(false);
        });

        // Component unmount hone par listener ko band kar dein
        return () => unsubscribe();
    }, []);

    return (
        <Card className="dashboard-card h-100">
            <Card.Header>
                <strong>Live Activity Feed</strong>
            </Card.Header>
            <Card.Body style={{ overflowY: 'auto', maxHeight: '400px' }}>
                {loading ? (
                    <div className="text-center"><Spinner animation="border" size="sm" /></div>
                ) : (
                    <ListGroup variant="flush">
                        {activities.map(activity => (
                            <ListGroup.Item key={activity.id} className="d-flex justify-content-between align-items-start border-0 px-0">
                                <div className="ms-2 me-auto">
                                    <span className="me-2">{getActivityIcon(activity.type)}</span>
                                    {activity.message}
                                </div>
                                <Badge bg="light" text="dark">
                                    {activity.timestamp ? timeSince(activity.timestamp.toDate()) : ''}
                                </Badge>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                )}
                 {activities.length === 0 && !loading && (
                    <p className="text-center text-muted mt-3">No recent activity.</p>
                )}
            </Card.Body>
        </Card>
    );
};

export default LiveActivityFeed;
