import React, { useState, useEffect } from 'react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@radix-ui/react-dropdown-menu';

// Example data structure for domain combinations
const domainCombinations = {
  'Physics & Astronomy': ['Chemistry', 'English'],
  'Biology': ['Chemistry', 'Mathematics'],
};

const DynamicDropdown = () => {
  const [primaryDomain, setPrimaryDomain] = useState<keyof typeof domainCombinations | ''>('');
  const [secondaryDomains, setSecondaryDomains] = useState<string[]>([]);

  useEffect(() => {
    // Update secondary domains based on the selected primary domain
    if (primaryDomain) {
      setSecondaryDomains(domainCombinations[primaryDomain] || []);
    } else {
      setSecondaryDomains([]);
    }
  }, [primaryDomain]);

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button>Select Primary Domain</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {Object.keys(domainCombinations).map((domain) => (
            <DropdownMenuItem key={domain} onSelect={() => setPrimaryDomain(domain as keyof typeof domainCombinations)}>
              {domain}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {primaryDomain && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button>Select Secondary Domain</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {secondaryDomains.map((domain) => (
              <DropdownMenuItem key={domain}>{domain}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default DynamicDropdown;
