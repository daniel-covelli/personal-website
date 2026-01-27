'use client';

import { useState } from 'react';
import {
  ResumeContent,
  Experience,
  Education,
  SkillCategory,
  Project,
} from '@/lib/types';

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

  function updateExperience(
    index: number,
    field: keyof Experience,
    value: string | string[]
  ) {
    const newExp = [...content.experience];
    newExp[index] = { ...newExp[index], [field]: value };
    setContent({ ...content, experience: newExp });
  }

  function addExperienceBullet(expIndex: number) {
    const newExp = [...content.experience];
    newExp[expIndex] = {
      ...newExp[expIndex],
      bullets: [...(newExp[expIndex].bullets || []), ''],
    };
    setContent({ ...content, experience: newExp });
  }

  function updateExperienceBullet(
    expIndex: number,
    bulletIndex: number,
    value: string
  ) {
    const newExp = [...content.experience];
    const newBullets = [...newExp[expIndex].bullets];
    newBullets[bulletIndex] = value;
    newExp[expIndex] = { ...newExp[expIndex], bullets: newBullets };
    setContent({ ...content, experience: newExp });
  }

  function removeExperienceBullet(expIndex: number, bulletIndex: number) {
    const newExp = [...content.experience];
    newExp[expIndex] = {
      ...newExp[expIndex],
      bullets: newExp[expIndex].bullets.filter((_, i) => i !== bulletIndex),
    };
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
          bullets: [],
        },
      ],
    });
  }

  function removeExperience(index: number) {
    const newExp = content.experience.filter((_, i) => i !== index);
    setContent({ ...content, experience: newExp });
  }

  function updateEducation(
    index: number,
    field: keyof Education,
    value: string | string[]
  ) {
    const newEdu = [...content.education];
    newEdu[index] = { ...newEdu[index], [field]: value };
    setContent({ ...content, education: newEdu });
  }

  function addEducationBullet(eduIndex: number) {
    const newEdu = [...content.education];
    newEdu[eduIndex] = {
      ...newEdu[eduIndex],
      bullets: [...(newEdu[eduIndex].bullets || []), ''],
    };
    setContent({ ...content, education: newEdu });
  }

  function updateEducationBullet(
    eduIndex: number,
    bulletIndex: number,
    value: string
  ) {
    const newEdu = [...content.education];
    const newBullets = [...newEdu[eduIndex].bullets];
    newBullets[bulletIndex] = value;
    newEdu[eduIndex] = { ...newEdu[eduIndex], bullets: newBullets };
    setContent({ ...content, education: newEdu });
  }

  function removeEducationBullet(eduIndex: number, bulletIndex: number) {
    const newEdu = [...content.education];
    newEdu[eduIndex] = {
      ...newEdu[eduIndex],
      bullets: newEdu[eduIndex].bullets.filter((_, i) => i !== bulletIndex),
    };
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
          description: '',
          bullets: [],
        },
      ],
    });
  }

  function removeEducation(index: number) {
    const newEdu = content.education.filter((_, i) => i !== index);
    setContent({ ...content, education: newEdu });
  }

  function updateSkillCategory(
    index: number,
    field: keyof SkillCategory,
    value: string | string[]
  ) {
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
    const newCategories = content.skills.categories.filter(
      (_, i) => i !== index
    );
    setContent({ ...content, skills: { categories: newCategories } });
  }

  function updateProject(index: number, field: keyof Project, value: unknown) {
    const newProjects = [...content.projects];
    newProjects[index] = { ...newProjects[index], [field]: value };
    setContent({ ...content, projects: newProjects });
  }

  function addProjectBullet(projIndex: number) {
    const newProjects = [...content.projects];
    newProjects[projIndex] = {
      ...newProjects[projIndex],
      bullets: [...(newProjects[projIndex].bullets || []), ''],
    };
    setContent({ ...content, projects: newProjects });
  }

  function updateProjectBullet(
    projIndex: number,
    bulletIndex: number,
    value: string
  ) {
    const newProjects = [...content.projects];
    const newBullets = [...newProjects[projIndex].bullets];
    newBullets[bulletIndex] = value;
    newProjects[projIndex] = { ...newProjects[projIndex], bullets: newBullets };
    setContent({ ...content, projects: newProjects });
  }

  function removeProjectBullet(projIndex: number, bulletIndex: number) {
    const newProjects = [...content.projects];
    newProjects[projIndex] = {
      ...newProjects[projIndex],
      bullets: newProjects[projIndex].bullets.filter(
        (_, i) => i !== bulletIndex
      ),
    };
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
          bullets: [],
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

  const sections = [
    'header',
    'experience',
    'education',
    'skills',
    'projects',
    'contact',
  ];

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Sidebar Navigation */}
      <nav className="flex-shrink-0 lg:w-48">
        <ul className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {sections.map((section) => (
            <li key={section}>
              <button
                onClick={() => setActiveSection(section)}
                className={`w-full whitespace-nowrap rounded-lg px-4 py-2 text-left capitalize transition-colors ${
                  activeSection === section
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {section}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Content Area */}
      <div className="flex-1 rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
        {activeSection === 'header' && (
          <div className="space-y-4">
            <h3 className="mb-4 text-lg font-semibold">Header / Bio</h3>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                value={content.header.name}
                onChange={(e) => updateHeader('name', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                value={content.header.title}
                onChange={(e) => updateHeader('title', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Bio
              </label>
              <textarea
                value={content.header.bio}
                onChange={(e) => updateHeader('bio', e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Profile Image URL
              </label>
              <input
                type="text"
                value={content.header.imageUrl}
                onChange={(e) => updateHeader('imageUrl', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
        )}

        {activeSection === 'experience' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Experience</h3>
              <button
                onClick={addExperience}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                Add Experience
              </button>
            </div>
            {content.experience.map((exp, index) => (
              <div
                key={exp.id}
                className="space-y-3 rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between">
                  <span className="text-sm text-gray-500">
                    Experience {index + 1}
                  </span>
                  <button
                    onClick={() => removeExperience(index)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Job Title"
                  value={exp.jobTitle}
                  onChange={(e) =>
                    updateExperience(index, 'jobTitle', e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Company"
                  value={exp.company}
                  onChange={(e) =>
                    updateExperience(index, 'company', e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Start Date (YYYY-MM)"
                    value={exp.startDate}
                    onChange={(e) =>
                      updateExperience(index, 'startDate', e.target.value)
                    }
                    className="rounded-lg border border-gray-300 px-3 py-2"
                  />
                  <input
                    type="text"
                    placeholder="End Date or Present"
                    value={exp.endDate}
                    onChange={(e) =>
                      updateExperience(index, 'endDate', e.target.value)
                    }
                    className="rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
                <textarea
                  placeholder="Description (optional paragraph above bullets)"
                  value={exp.description || ''}
                  onChange={(e) =>
                    updateExperience(index, 'description', e.target.value)
                  }
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Bullet Points
                  </label>
                  {(exp.bullets || []).map((bullet, bulletIndex) => (
                    <div key={bulletIndex} className="flex gap-2">
                      <input
                        type="text"
                        placeholder={`Bullet ${bulletIndex + 1}`}
                        value={bullet}
                        onChange={(e) =>
                          updateExperienceBullet(
                            index,
                            bulletIndex,
                            e.target.value
                          )
                        }
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
                      />
                      <button
                        onClick={() =>
                          removeExperienceBullet(index, bulletIndex)
                        }
                        className="rounded-lg px-3 py-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addExperienceBullet(index)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add bullet
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'education' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Education</h3>
              <button
                onClick={addEducation}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                Add Education
              </button>
            </div>
            {content.education.map((edu, index) => (
              <div
                key={edu.id}
                className="space-y-3 rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between">
                  <span className="text-sm text-gray-500">
                    Education {index + 1}
                  </span>
                  <button
                    onClick={() => removeEducation(index)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Degree"
                  value={edu.degree}
                  onChange={(e) =>
                    updateEducation(index, 'degree', e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Institution"
                  value={edu.institution}
                  onChange={(e) =>
                    updateEducation(index, 'institution', e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Start Date"
                    value={edu.startDate}
                    onChange={(e) =>
                      updateEducation(index, 'startDate', e.target.value)
                    }
                    className="rounded-lg border border-gray-300 px-3 py-2"
                  />
                  <input
                    type="text"
                    placeholder="End Date"
                    value={edu.endDate}
                    onChange={(e) =>
                      updateEducation(index, 'endDate', e.target.value)
                    }
                    className="rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
                <textarea
                  placeholder="Description (optional paragraph above bullets)"
                  value={edu.description || ''}
                  onChange={(e) =>
                    updateEducation(index, 'description', e.target.value)
                  }
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Bullet Points
                  </label>
                  {(edu.bullets || []).map((bullet, bulletIndex) => (
                    <div key={bulletIndex} className="flex gap-2">
                      <input
                        type="text"
                        placeholder={`Bullet ${bulletIndex + 1}`}
                        value={bullet}
                        onChange={(e) =>
                          updateEducationBullet(
                            index,
                            bulletIndex,
                            e.target.value
                          )
                        }
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
                      />
                      <button
                        onClick={() =>
                          removeEducationBullet(index, bulletIndex)
                        }
                        className="rounded-lg px-3 py-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addEducationBullet(index)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add bullet
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'skills' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Skills</h3>
              <button
                onClick={addSkillCategory}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                Add Category
              </button>
            </div>
            {content.skills.categories.map((category, index) => (
              <div
                key={category.id}
                className="space-y-3 rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between">
                  <span className="text-sm text-gray-500">
                    Category {index + 1}
                  </span>
                  <button
                    onClick={() => removeSkillCategory(index)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Category Name (e.g., Languages)"
                  value={category.name}
                  onChange={(e) =>
                    updateSkillCategory(index, 'name', e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Skills (comma-separated)"
                  value={category.items.join(', ')}
                  onChange={(e) =>
                    updateSkillCategory(
                      index,
                      'items',
                      e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
            ))}
          </div>
        )}

        {activeSection === 'projects' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Projects</h3>
              <button
                onClick={addProject}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                Add Project
              </button>
            </div>
            {content.projects.map((project, index) => (
              <div
                key={project.id}
                className="space-y-3 rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between">
                  <span className="text-sm text-gray-500">
                    Project {index + 1}
                  </span>
                  <button
                    onClick={() => removeProject(index)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Project Name"
                  value={project.name}
                  onChange={(e) => updateProject(index, 'name', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
                <textarea
                  placeholder="Description (optional paragraph above bullets)"
                  value={project.description || ''}
                  onChange={(e) =>
                    updateProject(index, 'description', e.target.value)
                  }
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Bullet Points
                  </label>
                  {(project.bullets || []).map((bullet, bulletIndex) => (
                    <div key={bulletIndex} className="flex gap-2">
                      <input
                        type="text"
                        placeholder={`Bullet ${bulletIndex + 1}`}
                        value={bullet}
                        onChange={(e) =>
                          updateProjectBullet(
                            index,
                            bulletIndex,
                            e.target.value
                          )
                        }
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
                      />
                      <button
                        onClick={() => removeProjectBullet(index, bulletIndex)}
                        className="rounded-lg px-3 py-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addProjectBullet(index)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add bullet
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Tech Stack (comma-separated)"
                  value={project.techStack.join(', ')}
                  onChange={(e) =>
                    updateProject(
                      index,
                      'techStack',
                      e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="GitHub URL"
                  value={project.links.github || ''}
                  onChange={(e) =>
                    updateProject(index, 'links', {
                      ...project.links,
                      github: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Live Demo URL"
                  value={project.links.live || ''}
                  onChange={(e) =>
                    updateProject(index, 'links', {
                      ...project.links,
                      live: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
            ))}
          </div>
        )}

        {activeSection === 'contact' && (
          <div className="space-y-4">
            <h3 className="mb-4 text-lg font-semibold">Contact Information</h3>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                value={content.contact.phone}
                onChange={(e) => updateContact('phone', e.target.value)}
                placeholder="555-123-4567"
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Location (City, State)
              </label>
              <input
                type="text"
                value={content.contact.location}
                onChange={(e) => updateContact('location', e.target.value)}
                placeholder="San Francisco, CA"
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={content.contact.email}
                onChange={(e) => updateContact('email', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                LinkedIn URL
              </label>
              <input
                type="text"
                value={content.contact.linkedin}
                onChange={(e) => updateContact('linkedin', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                GitHub URL
              </label>
              <input
                type="text"
                value={content.contact.github}
                onChange={(e) => updateContact('github', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Twitter URL
              </label>
              <input
                type="text"
                value={content.contact.twitter}
                onChange={(e) => updateContact('twitter', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Personal Website
              </label>
              <input
                type="text"
                value={content.contact.website}
                onChange={(e) => updateContact('website', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-8 border-t border-gray-200 pt-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {message && (
              <span
                className={`text-sm ${
                  message.includes('success')
                    ? 'text-green-600'
                    : 'text-red-600'
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
