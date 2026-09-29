import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { api } from "@/api/client";
import { Field } from "@/components/field";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAction } from "@/lib/use-action";

export const projectsKey = ["GET /api/v1/projects"] as const;

export const Route = createFileRoute("/app/_authed/_org/projects/")({ component: Projects });

function Projects() {
  const projects = useInfiniteQuery({
    queryKey: projectsKey,
    queryFn: ({ pageParam }) =>
      api("GET /api/v1/projects", { query: { cursor: pageParam ?? undefined } }),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
  });
  const rows = projects.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <>
      <PageHeader
        title="Projects"
        description="The example resource. Copy its route, API and page for your own entities."
        actions={<CreateProject />}
      />
      {projects.error && (
        <Alert variant="destructive">
          <AlertDescription>{projects.error.message}</AlertDescription>
        </Alert>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">
                <Link to="/app/projects/$projectId" params={{ projectId: project.id }}>
                  {project.name}
                </Link>
              </TableCell>
              <TableCell className="max-w-80 truncate text-muted-foreground">
                {project.description}
              </TableCell>
              <TableCell>{new Date(project.createdAt).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
          {projects.isSuccess && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                No projects yet. Create the first one.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {projects.hasNextPage && (
        <Button
          variant="outline"
          disabled={projects.isFetchingNextPage}
          onClick={() => void projects.fetchNextPage()}
        >
          Load more
        </Button>
      )}
    </>
  );
}

function CreateProject() {
  const [open, setOpen] = useState(false);
  const { pending, error, run } = useAction();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New project</Button>
      </DialogTrigger>
      <DialogContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void run(async () => {
              const project = await api("POST /api/v1/projects", {
                body: {
                  name: String(form.get("name")),
                  description: String(form.get("description")) || null,
                },
              });
              await queryClient.invalidateQueries({ queryKey: projectsKey });
              setOpen(false);
              await navigate({
                to: "/app/projects/$projectId",
                params: { projectId: project.id },
              });
            });
          }}
        >
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
          </DialogHeader>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Field label="Name" name="name" required maxLength={100} />
          <Field label="Description" name="description" maxLength={500} />
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
