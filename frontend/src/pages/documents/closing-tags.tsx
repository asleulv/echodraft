primary-800 dark:hover:text-primary-600"
                      }
                    >
                      {showVersions ? '▲' : '▼'}
                    </button>
                  </div>
                  
                  {/* Author badge */}
                  <div className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-primary-50 text-primary-600">
                    <span className="mr-1">Author:</span>
                    <span>{docData.created_by_name}</span>
                  </div>
                  
                  {/* Dates in compact format */}
                  <div className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-primary-50 text-primary-600">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span className="mr-1">Created:</span>
                    <span>{new Date(docData.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-primary-50 text-primary-600">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span className="mr-1">Updated:</span>
                    <span>{new Date(docData.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {/* Tags section */}
                {docData.tags && docData.tags.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center mb-1">
                      <Tag className="w-3 h-3 mr-1 text-primary-500" />
                      <span className="text-xs text-primary-500">Tags:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {docData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Document versions dropdown */}
                {showVersions && (
                  <div className="mt-3 border border-primary-200 rounded-md p-2">
                    <h4 className="text-sm font-medium mb-2">Document Versions</h4>
                    {isLoadingVersions ? (
                      <p className="text-sm text-primary-500">Loading versions...</p>
                    ) : versions.length > 0 ? (
                      <ul className="space-y-1">
                        {versions.map((version) => (
                          <li key={version.id} className="text-sm">
                            <a
                              href={`/documents/${docData.slug}?version=${version.version}`}
                              className={`block p-1 hover:bg-primary-100 rounded ${
                                version.version === docData.version ? 'bg-primary-100 font-medium' : ''
                              }`}
                            >
                              Version {version.version} - {new Date(version.updated_at).toLocaleDateString()}
                              {version.version === docData.version && ' (current)'}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-primary-500">No previous versions found.</p>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Document content */}
            <div className="prose dark:prose-invert max-w-none">
              <TipTapViewer content={docData.content} />
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
