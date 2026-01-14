"use client";

import React, { useState, useEffect } from "react";
import { Bell, Send, Users, UserCheck, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3420/api";

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  // Settings
  const [checkInMessage, setCheckInMessage] = useState("");
  const [checkOutMessage, setCheckOutMessage] = useState("");
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");

  // Custom notification
  const [customTitle, setCustomTitle] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [recipients, setRecipients] = useState<"all" | "selected">("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Users list for selection
  const [users, setUsers] = useState<any[]>([]);

  // Notification logs
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    loadSettings();
    loadUsers();
    loadLogs();
  }, []);

  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_token");
    }
    return null;
  };

  const loadSettings = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/notifications/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setCheckInMessage(data.data.check_in_message || "");
        setCheckOutMessage(data.data.check_out_message || "");
        setCheckInTime(data.data.check_in_time || "");
        setCheckOutTime(data.data.check_out_time || "");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const loadLogs = async () => {
    try {
      setLogsLoading(true);
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/notifications/logs?limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setLogs(data.data || []);
      }
    } catch (error) {
      console.error("Error loading logs:", error);
    } finally {
      setLogsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const token = getAuthToken();

      // Update check-in settings
      await fetch(`${API_URL}/notifications/settings/check-in`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: checkInMessage,
          time: checkInTime,
        }),
      });

      // Update check-out settings
      await fetch(`${API_URL}/notifications/settings/check-out`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: checkOutMessage,
          time: checkOutTime,
        }),
      });

      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const sendCustomNotification = async () => {
    if (!customTitle || !customBody) {
      alert("Please fill in title and message");
      return;
    }

    if (recipients === "selected" && selectedUsers.length === 0) {
      alert("Please select at least one user");
      return;
    }

    if (
      !confirm(
        `Send notification to ${
          recipients === "all"
            ? "all users"
            : `${selectedUsers.length} selected users`
        }?`
      )
    ) {
      return;
    }

    try {
      setSending(true);
      const token = getAuthToken();

      const response = await fetch(`${API_URL}/notifications/send-custom`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: customTitle,
          body: customBody,
          recipients,
          userIds: recipients === "selected" ? selectedUsers : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Notification sent successfully!");
        setCustomTitle("");
        setCustomBody("");
        setSelectedUsers([]);
        loadLogs(); // Refresh logs
      } else {
        alert(
          "Failed to send notification: " + (data.error || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      alert("Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground mt-1">
          Manage notification messages and send custom alerts to users
        </p>
      </div>

      {/* Notification Message Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Attendance Notification Messages
          </CardTitle>
          <CardDescription>
            Configure the messages sent for check-in and check-out reminders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Check-in Settings */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="checkInMessage">
                  Check-In Notification Message
                </Label>
                <Textarea
                  id="checkInMessage"
                  value={checkInMessage}
                  onChange={(e) => setCheckInMessage(e.target.value)}
                  placeholder="Enter check-in reminder message..."
                  className="mt-2"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="checkInTime">Check-In Reminder Time</Label>
                <Input
                  id="checkInTime"
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Time to send check-in reminder (IST)
                </p>
              </div>
            </div>

            {/* Check-out Settings */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="checkOutMessage">
                  Check-Out Notification Message
                </Label>
                <Textarea
                  id="checkOutMessage"
                  value={checkOutMessage}
                  onChange={(e) => setCheckOutMessage(e.target.value)}
                  placeholder="Enter check-out reminder message..."
                  className="mt-2"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="checkOutTime">Check-Out Reminder Time</Label>
                <Input
                  id="checkOutTime"
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Time to send check-out reminder (IST)
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={saveSettings}
            disabled={saving}
            className="w-full md:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Send Custom Notification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Custom Notification
          </CardTitle>
          <CardDescription>
            Send a custom notification to all users or selected users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="customTitle">Notification Title</Label>
            <Input
              id="customTitle"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Enter notification title..."
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="customBody">Notification Message</Label>
            <Textarea
              id="customBody"
              value={customBody}
              onChange={(e) => setCustomBody(e.target.value)}
              placeholder="Enter notification message..."
              className="mt-2"
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="recipients">Recipients</Label>
            <Select
              value={recipients}
              onValueChange={(value: any) => setRecipients(value)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    All Users
                  </div>
                </SelectItem>
                <SelectItem value="selected">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Selected Users
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {recipients === "selected" && (
            <div>
              <Label>Select Users</Label>
              <div className="mt-2 border rounded-lg p-4 max-h-64 overflow-y-auto">
                {users.map((user) => (
                  <div
                    key={user.user_id}
                    className="flex items-center gap-2 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.user_id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.user_id]);
                        } else {
                          setSelectedUsers(
                            selectedUsers.filter((id) => id !== user.user_id)
                          );
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">
                      {user.name} ({user.employee_code || user.email})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={sendCustomNotification}
            disabled={sending}
            className="w-full"
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Notification
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription>Recently sent notifications</CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Recipient</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground"
                    >
                      No notifications sent yet
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {new Date(log.sent_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {log.notification_type}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{log.title}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.body}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.users?.name || "Unknown"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
