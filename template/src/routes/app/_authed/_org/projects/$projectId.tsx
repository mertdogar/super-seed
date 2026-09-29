import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { api, apiQuery } from "@/api/client";
import { Field } from "@/components/field";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAction } from "@/lib/use-action";
import { errorMessage } from "@/lib/utils";

import { projectsKey } from "./index";

const projectQuery = (id: string) => apiQuery("GET /api/v1/projects/{id}", { params: { id } });

export const Route = createFileRoute("/app/_authed/_org/projects/$projectId")({
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(projectQuery(params.projectId)),
  component: ProjectDetail,
  errorComponent: ({ error }) => (
    <div className="space-y-3">
      <p className="text-muted-foreground">{errorMessage(error)}</p>
      <Link to="/app/projects" className="text-sm font-medium">
        Back to projects
      </Link>
    </div>
  ),
});

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const { data: project } = useSuspenseQuery(projectQuery(projectId));
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { pending, error, run } = useAction();

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: projectsKey });
    await queryClient.invalidateQueries({ queryKey: projectQuery(projectId).queryKey });
  }

  return (
    <>
      <PageHeader
        title={project.name}
        description={`Created ${new Date(project.createdAt).toLocaleString()}`}
        actions={
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              run(async () => {
                await api("DELETE /api/v1/projects/{id}", { params: { id: projectId } });
                await queryClient.invalidateQueries({ queryKey: projectsKey });
                await navigate({ to: "/app/projects" });
              })
            }
          >
            Delete
          </Button>
        }
      />
      <Card>
        <CardContent>
          <form
            key={project.updatedAt}
            className="grid max-w-md gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              void run(async () => {
                await api("PATCH /api/v1/projects/{id}", {
                  params: { id: projectId },
                  body: {
                    name: String(form.get("name")),
                    description: String(form.get("description")) || null,
                  },
                });
                await refresh();
                toast.success("Project saved");
              });
            }}
          >
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Field label="Name" name="name" defaultValue={project.name} required maxLength={100} />
            <Field
              label="Description"
              name="description"
              defaultValue={project.description ?? ""}
              maxLength={500}
            />
            <Button type="submit" disabled={pending} className="justify-self-start">
              Save
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
