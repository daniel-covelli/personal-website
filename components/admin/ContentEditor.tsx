'use client';

import { useState } from 'react';
import { ResumeContent, Experience, Education, SkillCategory, Project } from '@/lib/types';

interface ContentEditorProps {
  initialContent: ResumeContent;
}

export default function ContentEditor({ initialContent }: ContentEditorProps) {
  const [content, setContent] = useState<ResumeContent>(initialContent);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeSection, setActiveSection] = useState('header');

  async function handleSave() {
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });

      if (res.ok) {
        setMessage('Content saved successfully!');
      } else {
        setMessage('Failed to save content');
      }
    } catch {
      setMessage('Error saving content');
    }

    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  }

  function updateHeader(field: keyof typeof content.header, value: string) {
    setContent({
      ...content,
      header: { ...content.header, [field]: value },
    });
  }

  function updateExperience(index: number, field: keyof Experience, value: string) {
    const newExp = [...content.experience];
    newExp[index] = { ...newExp[index], [field]: value };
    setContent({ ...content, experience: newExp });
  }

  function addExperience() {
    setContent({
      ...content,
      experience: [
        ...content.experience,
        {
          id: Date.now().toString(),
          jobTitle: '',
          company: '',
          startDate: '',
          endDate: '',
          description: '',
        },
      ],
    });
  }

  function removeExperience(index: number) {
    const newExp = content.experience.filter((_, i) => i !== index);
    setContent({ ...content, experience: newExp });
  }

  function updateEducation(index: number, field: keyof Education, value: string) {
    const newEdu = [...content.education];
    newEdu[index] = { ...newEdu[index], [field]: value };
    setContent({ ...content, education: newEdu });
  }

  function addEducation() {
    setContent({
      ...content,
      education: [
        ...content.education,
        {
          id: Date.now().toString(),
          degree: '',
          institution: '',
          startDate: '',
          endDate: '',
          details: '',
        },
      ],
    });
  }

  function removeEducation(index: number) {
    const newEdu = content.education.filter((_, i) => i !== index);
    setContent({ ...content, education: newEdu });
  }

  function updateSkillCategory(index: number, field: keyof SkillCategory, value: string | string[]) {
    const newCategories = [...content.skills.categories];
    newCategories[index] = { ...newCategories[index], [field]: value };
    setContent({ ...content, skills: { categories: newCategories } });
  }

  function addSkillCategory() {
    setContent({
      ...content,
      skills: {
        categories: [
          ...content.skills.categories,
          { id: Date.now().toString(), name: '', items: [] },
        ],
      },
    });
  }

  function removeSkillCategory(index: number) {
    const newCategories = content.skills.categories.filter((_, i) => i !== index);
    setContent({ ...content, skills: { categories: newCategories } });
  }

  function updateProject(index: number, field: keyof Project, value: unknown) {
    const newProjects = [...content.projects];
    newProjects[index] = { ...newProjects[index], [field]: value };
    setContent({ ...content, projects: newProjects });
  }

  function addProject() {
    setContent({
      ...content,
      projects: [
        ...content.projects,
        {
          id: Date.now().toString(),
          name: '',
          description: '',
          techStack: [],
          links: {},
        },
      ],
    });
  }

  function removeProject(index: number) {
    const newProjects = content.projects.filter((_, i) => i !== index);
    setContent({ ...content, projects: newProjects });
  }

  function updateContact(field: keyof typeof content.contact, value: string) {
    setContent({
      ...content,
      contact: { ...content.contact, [field]: value },
    });
  }

  const sections = ['header', 'experience', 'education', 'skills', 'projects', 'contact'];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar Navigation */}
      <nav className="lg:w-48 flex-shrink-0">
        <ul className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible">
          {sections.map((section) => (
            <li key={section}>
              <button
                onClick={() => setActiveSection(section)}
                className={`w-full text-left px-4 py-2 rounded-lg capitalize transition-colors whitespace-nowrap ${
                  activeSection === section
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {section}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Content Area */}
      <div className="flex-1 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        {activeSection === 'header' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Header / Bio</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={content.header.name}
                onChange={(e) => updateHeader('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={content.header.title}
                onChange={(e) => updateHeader('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={content.header.bio}
                onChange={(e) => updateHeader('bio', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profile Image URL</label>
              <input
                type="text"
                value={content.header.imageUrl}
                onChange={(e) => updateHeader('imageUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
        )}

        {activeSection === 'experience' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Experience</h3>
              <button
                onClick={addExperience}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Add Experience
              </button>
            </div>
            {content.experience.map((exp, index) => (
              <div key={exp.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-sm text-gray-500">Experience {index + 1}</span>
                  <button
                    onClick={() => removeExperience(index)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Job Title"
                  value={exp.jobTitle}
                  onChange={(e) => updateExperience(index, 'jobTitle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Company"
                  value={exp.company}
                  onChange={(e) => updateExperience(index, 'company', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Start Date (YYYY-MM)"
                    value={exp.startDate}
                    onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="End Date or Present"
                    value={exp.endDate}
                    onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <textarea
                  placeholder="Description"
                  value={exp.description}
                  onChange={(e) => updateExperience(index, 'description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            ))}
          </div>
        )}

        {activeSection === 'education' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Education</h3>
              <button
                onClick={addEducation}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Add Education
              </button>
            </div>
            {content.education.map((edu, index) => (
              <div key={edu.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-sm text-gray-500">Education {index + 1}</span>
                  <button
                    onClick={() => removeEducation(index)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Degree"
                  value={edu.degree}
                  onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Institution"
                  value={edu.institution}
                  onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Start Date"
                    value={edu.startDate}
                    onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="End Date"
                    value={edu.endDate}
                    onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <textarea
                  placeholder="Details"
                  value={edu.details}
                  onChange={(e) => updateEducation(index, 'details', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            ))}
          </div>
        )}

        {activeSection === 'skills' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Skills</h3>
              <button
                onClick={addSkillCategory}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Add Category
              </button>
            </div>
            {content.skills.categories.map((category, index) => (
              <div key={category.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-sm text-gray-500">Category {index + 1}</span>
                  <button
                    onClick={() => removeSkillCategory(index)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Category Name (e.g., Languages)"
                  value={category.name}
                  onChange={(e) => updateSkillCategory(index, 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Skills (comma-separated)"
                  value={category.items.join(', ')}
                  onChange={(e) =>
                    updateSkillCategory(
                      index,
                      'items',
                      e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            ))}
          </div>
        )}

        {activeSection === 'projects' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Projects</h3>
              <button
                onClick={addProject}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Add Project
              </button>
            </div>
            {content.projects.map((project, index) => (
              <div key={project.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-sm text-gray-500">Project {index + 1}</span>
                  <button
                    onClick={() => removeProject(index)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Project Name"
                  value={project.name}
                  onChange={(e) => updateProject(index, 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <textarea
                  placeholder="Description"
                  value={project.description}
                  onChange={(e) => updateProject(index, 'description', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Tech Stack (comma-separated)"
                  value={project.techStack.join(', ')}
                  onChange={(e) =>
                    updateProject(
                      index,
                      'techStack',
                      e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="GitHub URL"
                  value={project.links.github || ''}
                  onChange={(e) =>
                    updateProject(index, 'links', { ...project.links, github: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Live Demo URL"
                  value={project.links.live || ''}
                  onChange={(e) =>
                    updateProject(index, 'links', { ...project.links, live: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            ))}
          </div>
        )}

        {activeSection === 'contact' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={content.contact.email}
                onChange={(e) => updateContact('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
              <input
                type="text"
                value={content.contact.linkedin}
                onChange={(e) => updateContact('linkedin', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GitHub URL</label>
              <input
                type="text"
                value={content.contact.github}
                onChange={(e) => updateContact('github', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Twitter URL</label>
              <input
                type="text"
                value={content.contact.twitter}
                onChange={(e) => updateContact('twitter', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Personal Website</label>
              <input
                type="text"
                value={content.contact.website}
                onChange={(e) => updateContact('website', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {message && (
              <span
                className={`text-sm ${
                  message.includes('success') ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {message}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
