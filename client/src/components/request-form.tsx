import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, FilePlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface RequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequestForm({ open, onOpenChange }: RequestFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    requestType: "",
    priority: "normal",
    description: "",
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/requests", data);
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Request submitted successfully! You can track its progress in your requests section.",
      });
      onOpenChange(false);
      setFormData({
        requestType: "",
        priority: "normal",
        description: "",
      });
      // Refetch requests
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.requestType || !formData.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    createRequestMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="text-center mb-4">
            <FilePlus className="text-primary text-3xl mb-2 mx-auto" />
            <DialogTitle className="text-2xl font-bold text-gray-900">Submit Request</DialogTitle>
            <p className="text-gray-600">Request documents or services</p>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="requestType">Request Type *</Label>
            <Select value={formData.requestType} onValueChange={(value) => handleInputChange("requestType", value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Academic Transcript">Academic Transcript</SelectItem>
                <SelectItem value="Enrollment Certificate">Enrollment Certificate</SelectItem>
                <SelectItem value="Grade Report">Grade Report</SelectItem>
                <SelectItem value="Letter of Recommendation">Letter of Recommendation</SelectItem>
                <SelectItem value="Student Verification">Student Verification</SelectItem>
                <SelectItem value="Course Completion Certificate">Course Completion Certificate</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="priority">Priority Level</Label>
            <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Please provide details about your request..."
              rows={4}
              className="mt-1"
              required
            />
          </div>
          
          <div className="flex space-x-3 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={createRequestMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-primary text-white hover:bg-blue-700"
              disabled={createRequestMutation.isPending}
            >
              {createRequestMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
