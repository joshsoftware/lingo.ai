"use client";

import { useEffect, useState } from "react";
import { API } from "@/lib/axios"; 
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useRouter } from "next/navigation";
import EditSubscription from "../components/EditSubscription";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(null);
  const router = useRouter();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/admin/users"); // Capitalized route path
      setUsers(data.users);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isModalOpen) {
      fetchUsers();
    }
    fetchUsers();
  }, [isModalOpen]);

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-4">Users</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow
                    key={u.id}
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => router.push(`/admin/users/${u.id}/recordings`)}
                  >
                    <TableCell>{u.username}</TableCell>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell>{u.subscription.name}</TableCell>
                    <TableCell className="flex gap-2 ">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsModalOpen(u.id);
                        }}
                        className="w-8 h-8  p-2 rounded-full flex items-center justify-center shadow-xl hover:bg-green-500 cursor-pointer border-green-800  hover:text-white"
                      >
                        <Edit2 size={20} />
                      </div>

                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Modal
        isOpen={!!isModalOpen}
        onClose={() => setIsModalOpen(null)}
        title="Update Subscription"
      >
        <EditSubscription
          userId={isModalOpen}
          setIsModalOpen={setIsModalOpen}
        />
      </Modal>
    </>
  );
}
