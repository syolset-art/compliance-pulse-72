import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, Users, BookOpen } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Course {
  id: string;
  title: string;
  title_no: string | null;
  content: string | null;
  content_no: string | null;
  duration_minutes: number;
  category: string;
  is_active: boolean;
  created_at: string;
}

const categoryLabels: Record<string, string> = {
  phishing: "Phishing",
  passwords: "Passord",
  privacy: "Personvern",
  remote_work: "Fjernarbeid",
  social_engineering: "Sosial manipulering",
  ai_awareness: "AI-bevissthet",
  data_handling: "Datahåndtering",
  incident_response: "Hendelsesrespons",
  general: "Generelt",
};

export function CoursesTab() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [completionCounts, setCompletionCounts] = useState<Record<string, number>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: "",
    title_no: "",
    content: "",
    content_no: "",
    duration_minutes: 5,
    category: "general",
  });

  const fetchCourses = async () => {
    const { data } = await supabase
      .from("security_micro_courses")
      .select("*")
      .order("created_at", { ascending: false });
    setCourses((data as Course[]) || []);

    const { data: completions } = await supabase
      .from("course_completions")
      .select("course_id");
    const counts: Record<string, number> = {};
    (completions || []).forEach((c: any) => {
      counts[c.course_id] = (counts[c.course_id] || 0) + 1;
    });
    setCompletionCounts(counts);
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleCreate = async () => {
    if (!newCourse.title_no) {
      toast.error("Tittel (norsk) er påkrevd");
      return;
    }
    const { error } = await supabase.from("security_micro_courses").insert({
      title: newCourse.title || newCourse.title_no,
      title_no: newCourse.title_no,
      content: newCourse.content,
      content_no: newCourse.content_no,
      duration_minutes: newCourse.duration_minutes,
      category: newCourse.category,
    });
    if (error) {
      toast.error("Kunne ikke opprette kurs");
    } else {
      toast.success("Kurs opprettet!");
      setDialogOpen(false);
      setNewCourse({ title: "", title_no: "", content: "", content_no: "", duration_minutes: 5, category: "general" });
      fetchCourses();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Sikkerhetskurs
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nytt kurs</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Opprett nytt sikkerhetskurs</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tittel (norsk)</Label>
                <Input value={newCourse.title_no} onChange={e => setNewCourse(p => ({ ...p, title_no: e.target.value }))} />
              </div>
              <div>
                <Label>Tittel (engelsk)</Label>
                <Input value={newCourse.title} onChange={e => setNewCourse(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <Label>Innhold (norsk)</Label>
                <Textarea value={newCourse.content_no} onChange={e => setNewCourse(p => ({ ...p, content_no: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Varighet (min)</Label>
                  <Input type="number" value={newCourse.duration_minutes} onChange={e => setNewCourse(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 5 }))} />
                </div>
                <div>
                  <Label>Kategori</Label>
                  <Select value={newCourse.category} onValueChange={v => setNewCourse(p => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full">Opprett kurs</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {courses.map(course => (
            <div key={course.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{course.title_no || course.title}</p>
                  <Badge variant="secondary">{categoryLabels[course.category] || course.category}</Badge>
                  {!course.is_active && <Badge variant="outline" className="text-muted-foreground">Inaktiv</Badge>}
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                  {course.content_no || course.content}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{course.duration_minutes} min</span>
                <span className="flex items-center gap-1"><Users className="h-4 w-4" />{completionCounts[course.id] || 0} fullført</span>
              </div>
            </div>
          ))}
          {courses.length === 0 && (
            <p className="text-muted-foreground text-center py-8">Ingen kurs ennå. Opprett ditt første kurs!</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
